"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Dynamically import MapComponent
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

type LatLng = [number, number];
interface TrackOrderParams {
  orderId: string;
}

type DriverUpdateEvent = {
  driver: { latitude: number; longitude: number };
};

type InitialEvent = {
  driver?: { latitude: number; longitude: number };
};

export default function TrackOrder() {

  const params = useParams<{ orderId: string }>();

  const orderId = params?.orderId;

  const [address, setAddress] = useState<string>("");
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [customerLocation, setCustomerLocation] = useState<LatLng | null>(null);
  const [eta, setEta] = useState<string>("calculating...");
  const [distance, setDistance] = useState<string>("calculating...");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error" | "disconnected"
  >("connecting");

  const eventSourceRef = useRef<EventSource | null>(null);
  const customerIdRef = useRef<string>(Math.random().toString(36).substring(2));

  // ✅ SSE for driver updates
  useEffect(() => {
    if (!orderId) return;

    setConnectionStatus("connecting");

    const eventSource = new EventSource(`/api/customer-events/${orderId}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("initial", (event: MessageEvent) => {
      setConnectionStatus("connected");
      const data: InitialEvent = JSON.parse(event.data);
      if (data.driver) {
        setDriverLocation([data.driver.latitude, data.driver.longitude]);
      }
    });

    eventSource.addEventListener("driver-update", (event: MessageEvent) => {
      const { driver }: DriverUpdateEvent = JSON.parse(event.data);
      setDriverLocation([driver.latitude, driver.longitude]);
    });

    eventSource.onerror = () => {
      setConnectionStatus("error");
      eventSource.close();
    };

    // ✅ Fix ESLint warning by capturing ref value
    const currentCustomerId = customerIdRef.current;

    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");

      fetch("/api/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerId: currentCustomerId,
          type: "customer",
        }),
      }).catch(console.error);
    };
  }, [orderId]);

  // ✅ Track customer live location
  useEffect(() => {
    if (!orderId) return;

    let watchId: number | null = null;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos: GeolocationPosition) => {
          const { latitude, longitude } = pos.coords;
          setCustomerLocation([latitude, longitude]);

          try {
            await fetch("/api/customer-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                latitude,
                longitude,
                address,
                customerId: customerIdRef.current,
              }),
            });
          } catch (error) {
            console.error("Failed to update customer location:", error);
          }
        },
        (err: GeolocationPositionError) =>
          console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [orderId, address]);

  // ✅ Handle manual address update
  const handleAddressSubmit = async () => {
    if (!address.trim()) return;

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data: { latitude?: number; longitude?: number } =
        await response.json();

      if (data.latitude && data.longitude) {
        setCustomerLocation([data.latitude, data.longitude]);

        await fetch("/api/customer-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            address,
            customerId: customerIdRef.current,
          }),
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

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
                onRouteCalculated={(eta: string, distance: string) => {
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
