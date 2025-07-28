// src/app/(customerFacing)/track/[orderId]/TrackOrderClient.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
  const socketRef = useRef<WebSocket | null>(null)
  const messageQueue = useRef<any[]>([])

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
        const message = {
          type: "customer-location",
          latitude: data.latitude,
          longitude: data.longitude,
          address,
          orderId
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(message))
        } else {
          messageQueue.current.push(message)
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket(`ws://${window.location.host}/api/websocket?orderId=${orderId}`)
      socketRef.current = socket

      socket.onopen = () => {
        // Send any queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift()
          socket.send(JSON.stringify(message))
        }
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "driver-location") {
          setDriverLocation([data.latitude, data.longitude])
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      socket.onclose = () => {
        console.log("WebSocket closed - attempting reconnect...")
        setTimeout(connectWebSocket, 3000) // Reconnect after 3 seconds
      }
    }

    connectWebSocket()

    // Get customer's current location
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCustomerLocation([latitude, longitude])
          const message = {
            type: "customer-location",
            latitude,
            longitude,
            orderId
          }

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message))
          } else {
            messageQueue.current.push(message)
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      )

      return () => {
        navigator.geolocation.clearWatch(watchId)
        if (socketRef.current) {
          socketRef.current.close()
        }
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [orderId])

  useEffect(() => {
    if (driverLocation && customerLocation) {
      calculateRoute(driverLocation, customerLocation)
    }
  }, [driverLocation, customerLocation])

  const calculateRoute = async (driverLoc: [number, number], customerLoc: [number, number]) => {
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Track Your Order #{orderId}</CardTitle>
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