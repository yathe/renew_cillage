"use client"

import { useEffect, useRef, useState, use } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const DynamicMap = dynamic(() => import("./DriverMap"), {
  ssr: false,
  loading: () => <p>Loading driver map...</p>,
})

interface Customer {
  id: string
  latitude: number
  longitude: number
  address?: string
  distance?: number
}

export default function DriverDashboard({ params }: { params: Promise<{ orderId: string }> }) {
  // Unwrap the params promise
  const { orderId } = use(params)
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalDistance, setTotalDistance] = useState("calculating...")
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const socketRef = useRef<WebSocket | null>(null)
  const messageQueue = useRef<any[]>([])

  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus("connecting")
      const socket = new WebSocket(`ws://${window.location.host}/api/websocket?orderId=${orderId}`)
      socketRef.current = socket

      socket.onopen = () => {
        setConnectionStatus("connected")
        // Send any queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift()
          socket.send(JSON.stringify(message))
        }
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "customer-location") {
          setCustomers(prev => {
            const existing = prev.find(c => c.id === data.id)
            return existing 
              ? prev.map(c => c.id === data.id ? {...c, ...data} : c)
              : [...prev, data]
          })
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setConnectionStatus("error")
      }

      socket.onclose = () => {
        setConnectionStatus("disconnected")
        console.log("WebSocket closed - attempting reconnect...")
        setTimeout(connectWebSocket, 3000) // Reconnect after 3 seconds
      }
    }

    connectWebSocket()

    // Get current driver location
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const message = {
            type: "driver-location",
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
  }, [orderId]) // Only orderId as dependency

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Driver Dashboard - Order #{orderId}
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
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">Total Route: {totalDistance}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">Customers: {customers.length}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="h-[500px] rounded-lg overflow-hidden">
              <DynamicMap 
                customers={customers}
                onRouteCalculated={(distance) => setTotalDistance(distance)}
              />
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Customer Stops</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customers.map((customer, i) => (
                  <div key={customer.id} className="p-2 border-b">
                    <p>
                      <strong>Stop #{i + 1}:</strong> {customer.address || "Customer"}
                    </p>
                    <p>Distance: {customer.distance?.toFixed(2) || "calculating"} km</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}