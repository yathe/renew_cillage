"use client"

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function TrackOrder() {
  const { orderId } = useParams();
  const [address, setAddress] = useState("");
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState("calculating...");
  const [distance, setDistance] = useState("calculating...");
  const [connectionStatus, setConnectionStatus] = useState<"connecting"|"connected"|"error"|"disconnected">("connecting");
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connectWebSocket = () => {
    setConnectionStatus("connecting");
    
    // Use your Node.js backend URL
    const socket = new WebSocket(`ws://localhost:3001`);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus("connected");
      console.log("WebSocket connected");
      
      // Join the order room
      socket.send(JSON.stringify({
        type: "join-order",
        orderId
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "driver-update") {
        setDriverLocation([data.latitude, data.longitude]);
      } 
      else if (data.type === "order-data") {
        if (data.driver) {
          setDriverLocation([data.driver.latitude, data.driver.longitude]);
        }
      }
    };

    socket.onerror = () => {
      setConnectionStatus("error");
      reconnect();
    };

    socket.onclose = () => {
      setConnectionStatus("disconnected");
      reconnect();
    };
  };

  const reconnect = () => {
    if (reconnectTimeout.current) return;
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = null;
      connectWebSocket();
    }, 3000);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [orderId]);

  // Send customer location updates
  const sendCustomerLocation = (latitude: number, longitude: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "customer-location",
        orderId,
        latitude,
        longitude,
        address
      }));
    }
  };

  // Get customer location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCustomerLocation([latitude, longitude]);
        sendCustomerLocation(latitude, longitude);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [orderId, address]);

  // Handle address submission
  const handleAddressSubmit = async () => {
    if (!address.trim()) return;
    
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });
      
      const data = await response.json();
      if (data.latitude && data.longitude) {
        setCustomerLocation([data.latitude, data.longitude]);
        sendCustomerLocation(data.latitude, data.longitude);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  // Calculate route when locations change
  useEffect(() => {
    if (driverLocation && customerLocation) {
      calculateRoute(driverLocation, customerLocation);
    }
  }, [driverLocation, customerLocation]);

  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, end })
      });
      
      const data = await response.json();
      
      if (data.features?.[0]?.properties?.summary) {
        const summary = data.features[0].properties.summary;
        const distanceKm = (summary.distance / 1000).toFixed(2);
        const etaMin = Math.round(summary.duration / 60);
        
        setEta(`${etaMin} min`);
        setDistance(`${distanceKm} km`);
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      setEta("error");
      setDistance("error");
    }
  };

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
                  setEta(eta);
                  setDistance(distance);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}