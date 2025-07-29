"use client"

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bike, Clock, MapPin, Users } from "lucide-react";

const DynamicMap = dynamic(() => import("./DriverMap"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function DriverDashboard() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState("calculating...");
  const [totalTime, setTotalTime] = useState("calculating...");
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting"|"connected"|"error"|"disconnected">("connecting");

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:3001`);
    socketRef.current = socket;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "all-customers") {
          setCustomers(Object.values(data.customers));
        } else if (data.type === "customer-location") {
          setCustomers(prev => {
            const existing = prev.find(c => c.id === data.id);
            return existing 
              ? prev.map(c => c.id === data.id ? {...c, ...data} : c)
              : [...prev, data];
          });
        } else if (data.type === "customer-disconnected") {
          setCustomers(prev => prev.filter(c => c.id !== data.id));
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    socket.onopen = () => {
      setConnectionStatus("connected");
      socket.send(JSON.stringify({
        type: "join-order",
        orderId
      }));
    };

    socket.onmessage = handleMessage;
    socket.onerror = () => setConnectionStatus("error");
    socket.onclose = () => setConnectionStatus("disconnected");

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: "driver-location",
              latitude,
              longitude,
              orderId
            }));
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.close();
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="w-6 h-6" />
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
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Route</p>
                    <p className="font-medium">{totalDistance}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Time</p>
                    <p className="font-medium">{totalTime}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Customers</p>
                    <p className="font-medium">{customers.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <DynamicMap 
                customers={customers}
                onRouteCalculated={(distance, time) => {
                  setTotalDistance(distance);
                  setTotalTime(time);
                }}
              />
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Stops
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customers.map((customer, i) => (
                  <div key={customer.id} className="p-3 border-b hover:bg-gray-50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {i+1}
                          </span>
                          {customer.address || "Customer Location"}
                        </p>
                        <div className="flex gap-4 mt-1 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {customer.distance?.toFixed(2) || "0.00"} km
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            {customer.eta || "calculating..."}
                          </span>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Navigate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}