// src/app/(customerFacing)/track/[orderId]/TrackOrderClient.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCallback } from "react";
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

export default function TrackOrderClient({ orderId }: { orderId: string }) {
  const [address, setAddress] = useState("")
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null)
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(null)
  const [eta, setEta] = useState<string>("calculating...")
  const [distance, setDistance] = useState<string>("calculating...")
  const [connectionStatus, setConnectionStatus] = useState<"connecting"|"connected"|"error"|"disconnected">("connecting")
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null)

  const handleAddressSubmit = async () => {
    if (!address.trim()) return
    
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      })
      
      const data = await response.json()
      if (data.latitude && data.longitude) {
        setCustomerLocation([data.latitude, data.longitude])
        sendWebSocketMessage({
          type: "customer-location",
          latitude: data.latitude,
          longitude: data.longitude,
          address,
          orderId
        })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }
// Add WebSocket message type
type WebSocketMessage = {
  type: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  orderId?: string;
};
 const sendWebSocketMessage = useCallback((message: WebSocketMessage) => {
  if (socketRef.current?.readyState === WebSocket.OPEN) {
    socketRef.current.send(JSON.stringify(message));
  }
}, []);

  const connectWebSocket = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached")
      return
    }
    }, [orderId, sentWebSocketMessage]);

    setConnectionStatus("connecting")
    const socket = new WebSocket(`ws://${window.location.host}/api/websocket?orderId=${orderId}`)
    socketRef.current = socket

    socket.onopen = () => {
      reconnectAttempts.current = 0
      setConnectionStatus("connected")
      console.log("WebSocket connected")
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "driver-location") {
          setDriverLocation([data.latitude, data.longitude])
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    socket.onerror = (event: Event) => {
      console.error("WebSocket error event:", event)
      setConnectionStatus("error")
    }

    socket.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code}: ${event.reason}`)
      setConnectionStatus("disconnected")
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1
        const delay = Math.min(1000 * (2 ** reconnectAttempts.current), 10000) // Exponential backoff with max 10s
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
        
        reconnectInterval.current = setTimeout(() => {
          connectWebSocket()
        }, delay)
      }
    }

    return socket
  }

  useEffect(() => {
    if (!orderId) return

    const socket = connectWebSocket()

    // Get customer's current location if available
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
            orderId
          })
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      )
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (socket) {
        socket.close()
      }
      if (reconnectInterval.current) {
        clearTimeout(reconnectInterval.current)
      }
    }
  }, [orderId])

  useEffect(() => {
    if (driverLocation && customerLocation) {
      calculateRoute(driverLocation, customerLocation)
    }
  }, [driverLocation, customerLocation, calculateRoute])

  const calculateRoute = useCallback(async (driverLoc: [number, number], customerLoc: [number, number]) => {
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: driverLoc,
          end: customerLoc
        })
      })
      
      const data = await response.json()
      
      if (data.features?.[0]?.properties?.summary) {
        const summary = data.features[0].properties.summary
        const distanceKm = (summary.distance / 1000).toFixed(2)
        const etaMin = Math.round(summary.duration / 60)
        
        setEta(`${etaMin} min`)
        setDistance(`${distanceKm} km`)
      }
    } catch (error) {
      console.error("Route calculation error:", error)
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Track Your Order #{orderId}
              <span className={`ml-2 text-sm font-normal ${
                connectionStatus === "connected" ? "text-green-500" :
                connectionStatus === "connecting" ? "text-yellow-500" :
                "text-red-500"
              }`}>
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
