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

interface DriverPageParams {
  orderId: string;
}

export default function DriverDashboard() {
  const params = useParams<DriverPageParams>();
  const orderId = params?.orderId;

  
 interface Customer {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance?: number;
  eta?: string;
}

const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalDistance, setTotalDistance] = useState("calculating...");
  const [totalTime, setTotalTime] = useState("calculating...");
  const [connectionStatus, setConnectionStatus] = useState<"connecting"|"connected"|"error"|"disconnected">("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  // const customerIdRef = useRef<string>(Math.random().toString(36).substring(2));

  // Track driver location
  useEffect(() => {
    let watchId: number | null = null;
    
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          
          try {
            await fetch('/api/driver-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                latitude,
                longitude
              })
            });
          } catch (error) {
            console.error("Failed to update driver location:", error);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [orderId]);

  // Connect to SSE for customer updates
  useEffect(() => {
    setConnectionStatus("connecting");
    
    const eventSource = new EventSource(`/api/driver-events/${orderId}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('initial', (event) => {
      setConnectionStatus("connected");
      const data = JSON.parse(event.data);
      setCustomers(data.customers || []);
    });

    eventSource.addEventListener('customer-update', (event) => {
      const { customer } = JSON.parse(event.data);
      setCustomers(prev => {
        const existing = prev.find(c => c.id === customer.id);
        return existing 
          ? prev.map(c => c.id === customer.id ? customer : c)
          : [...prev, customer];
      });
    });

    eventSource.addEventListener('customer-disconnected', (event) => {
      const { customerId } = JSON.parse(event.data);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    });

    eventSource.onerror = () => {
      setConnectionStatus("error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");
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
                            {customer.eta || "calculating..."} min
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
