"use client"

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DriverMapProps {
  customers: Array<{
    id: string;
    latitude: number;
    longitude: number;
    address?: string;
    distance?: number;
  }>;
  onRouteCalculated: (distance: string, time: string) => void;
}

export default function DriverMap({ customers, onRouteCalculated }: DriverMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const driverPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return;

    mapRef.current = L.map("map").setView([20.5937, 78.9629], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap'
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // Track driver position
  useEffect(() => {
    if (!mapRef.current || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        driverPosRef.current = { lat: latitude, lng: longitude };

        if (!driverMarkerRef.current) {
          const driverIcon = L.icon({
            iconUrl: "/raider.jpg", // Add your bike icon
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
          });
          driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon })
            .addTo(mapRef.current!)
            .bindPopup("Your Location");
        } else {
          driverMarkerRef.current.setLatLng([latitude, longitude]);
        }

        if (customers.length > 0) {
          calculateOptimalRoute(driverPosRef.current, customers);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [customers]);

  // Update customer markers
  useEffect(() => {
    if (!mapRef.current || !driverPosRef.current) return;

    customerMarkersRef.current.forEach(marker => marker.remove());
    customerMarkersRef.current = [];

    customers.forEach(customer => {
      const customerIcon = L.icon({
        iconUrl: "/raider.jpg", // Add your customer icon
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([customer.latitude, customer.longitude], { icon: customerIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="space-y-1">
            <h4 class="font-bold">${customer.address || "Customer"}</h4>
            <p>Distance: ${customer.distance?.toFixed(2) || "0.00"} km</p>
            <p>ETA: ${calculateETA(customer.distance || 0)}</p>
          </div>
        `);
      
      customerMarkersRef.current.push(marker);
    });

    if (driverPosRef.current && customers.length > 0) {
      calculateOptimalRoute(driverPosRef.current, customers);
    }
  }, [customers]);

  const calculateOptimalRoute = (driverPos: { lat: number; lng: number }, customers: any[]) => {
    if (routeLineRef.current) {
      routeLineRef.current.remove();
    }

    const sortedCustomers = [...customers]
      .map(c => ({
        ...c,
        distance: haversineDistance(driverPos.lat, driverPos.lng, c.latitude, c.longitude),
        eta: calculateETA(haversineDistance(driverPos.lat, driverPos.lng, c.latitude, c.longitude))
      }))
      .sort((a, b) => a.distance - b.distance);

    const routePoints = [
      [driverPos.lat, driverPos.lng],
      ...sortedCustomers.map(c => [c.latitude, c.longitude])
    ];

    routeLineRef.current = L.polyline(routePoints as any, {
      color: "#3b82f6",
      weight: 5,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(mapRef.current!);

    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const [lat1, lng1] = routePoints[i];
      const [lat2, lng2] = routePoints[i + 1];
      totalDistance += haversineDistance(lat1, lng1, lat2, lng2);
    }

    const totalTime = calculateTotalTime(totalDistance, sortedCustomers.length);
    onRouteCalculated(`${totalDistance.toFixed(2)} km`, totalTime);
    mapRef.current?.fitBounds(routeLineRef.current.getBounds());
  };

  const calculateETA = (distanceKm: number) => {
    const avgSpeedKmH = 30; // Average delivery speed
    const timeH = distanceKm / avgSpeedKmH;
    const timeM = Math.round(timeH * 60);
    return `${timeM} min`;
  };

  const calculateTotalTime = (totalDistanceKm: number, stops: number) => {
    const avgSpeedKmH = 30;
    const drivingTimeH = totalDistanceKm / avgSpeedKmH;
    const stopTimeH = stops * 5 / 60; // 5 minutes per stop
    const totalTimeM = Math.round((drivingTimeH + stopTimeH) * 60);
    return `${totalTimeM} min`;
  };

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
}