"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

type WebSocketMessage = {
  type: string
  latitude?: number
  longitude?: number
  address?: string
  orderId?: string
}

export default function TrackOrderClient({ orderId }: { orderId: string }) {
  const [address, setAddress] = useState("")
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null)
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(null)
  const [eta, setEta] = useState("calculating...")
  const [distance, setDistance] = useState("calculating...")
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("connecting")

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null)

  const sendWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }, [])

  const calculateRoute = useCallback(async (driverLoc: [number, number], customerLoc: [number, number]) => {
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: driverLoc,
          end: customerLoc,
        }),
      })

      const data = await response.json()
      const summary = data?.features?.[0]?.properties?.summary

      if (summary) {
        const distanceKm = (summary.distance / 1000).toFixed(2)
        const etaMin = Math.round(summary.duration / 60)

        setEta(`${etaMin} min`)
        setDistance(`${distanceKm} km`)
      }
    } catch (error) {
      console.error("Route calculation error:", error)
    }
  }, [])

  const connectWebSocket = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached")
      return
    }

    setConnectionStatus("connecting")
    const socket = new WebSocket(`ws://${window.location.host}/api/websocket?orderId=${orderId}`)
    socketRef.current = socket

    socket.onopen = () => {
      reconnectAttempts.current = 0
      setConnectionStatus("connected")
      console.log("WebSocket connected")
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        if (data.type === "driver-location" && data.latitude && data.longitude) {
          setDriverLocation([data.latitude, data.longitude])
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    socket.onerror = (event: Event) => {
      console.error("WebSocket error:", event)
      setConnectionStatus("error")
    }

    socket.onclose = (event) => {
      console.log(`WebSocket closed: ${event.reason}`)
      setConnectionStatus("disconnected")

      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000)
        reconnectInterval.current = setTimeout(connectWebSocket, delay)
      }
    }
  }, [orderId])

  const handleAddressSubmit = async () => {
    if (!address.trim()) return

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })

      const data = await response.json()
      if (data.latitude && data.longitude) {
        setCustomerLocation([data.latitude, data.longitude])
        sendWebSocketMessage({
          type: "customer-location",
          latitude: data.latitude,
          longitude: data.longitude,
          address,
          orderId,
        })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  useEffect(() => {
    if (!orderId) return
    connectWebSocket()

    let watchId: number | null = null
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCustomerLocation([latitude, longitude])
          sendWebSocketMessage({
            type: "customer-location",
            latitude,
            longitude,
            orderId,
          })
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      )
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (socketRef.current) {
        socketRef.current.close()
      }
      if (reconnectInterval.current) {
        clearTimeout(reconnectInterval.current)
      }
    }
  }, [orderId, connectWebSocket, sendWebSocketMessage])

  useEffect(() => {
    if (driverLocation && customerLocation) {
      calculateRoute(driverLocation, customerLocation)
    }
  }, [driverLocation, customerLocation, calculateRoute])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Track Your Order #{orderId}
              <span
                className={`ml-2 text-sm font-normal ${
                  connectionStatus === "connected"
                    ? "text-green-500"
                    : connectionStatus === "connecting"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                ({connectionStatus})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
              />
              <Button onClick={handleAddressSubmit}>Update Location</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">ETA: {eta}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">Distance: {distance}</p>
                </CardContent>
              </Card>
            </div>

            <div className="h-[500px] rounded-lg overflow-hidden">
              <DynamicMap
                driverLocation={driverLocation}
                customerLocation={customerLocation}
                onRouteCalculated={(eta, distance) => {
                  setEta(eta)
                  setDistance(distance)
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
