"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Customer {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance?: number;
  eta?: string;
}

interface DriverMapProps {
  customers: Customer[];
  onRouteCalculated: (distance: string, time: string) => void;
}

export default function DriverMap({ customers, onRouteCalculated }: DriverMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const driverPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const calculateETA = useCallback((distanceKm: number) => {
    const avgSpeedKmH = 30;
    const timeH = distanceKm / avgSpeedKmH;
    const timeM = Math.round(timeH * 60);
    return `${timeM} min`;
  }, []);

  const calculateTotalTime = useCallback((totalDistanceKm: number, stops: number) => {
    const avgSpeedKmH = 30;
    const drivingTimeH = totalDistanceKm / avgSpeedKmH;
    const stopTimeH = (stops * 5) / 60;
    const totalTimeM = Math.round((drivingTimeH + stopTimeH) * 60);
    return `${totalTimeM} min`;
  }, []);

  const haversineDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const calculateOptimalRoute = useCallback(
    (driverPos: { lat: number; lng: number } | null, customers: Customer[]) => {
      if (!driverPos || !mapRef.current) return;

      if (routeLineRef.current) {
        routeLineRef.current.remove();
      }

      const sortedCustomers = [...customers]
        .map((c) => {
          const dist = haversineDistance(driverPos.lat, driverPos.lng, c.latitude, c.longitude);
          return {
            ...c,
            distance: dist,
            eta: calculateETA(dist),
          };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      const routePoints = [
        [driverPos.lat, driverPos.lng],
        ...sortedCustomers.map((c) => [c.latitude, c.longitude]),
      ];

      routeLineRef.current = L.polyline(routePoints as [number, number][], {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(mapRef.current);

      let totalDistance = 0;
      for (let i = 0; i < routePoints.length - 1; i++) {
        const [lat1, lng1] = routePoints[i];
        const [lat2, lng2] = routePoints[i + 1];
        totalDistance += haversineDistance(lat1, lng1, lat2, lng2);
      }

      const totalTime = calculateTotalTime(totalDistance, sortedCustomers.length);
      onRouteCalculated(`${totalDistance.toFixed(2)} km`, totalTime);

      mapRef.current.fitBounds(routeLineRef.current.getBounds());
    },
    [calculateETA, calculateTotalTime, haversineDistance, onRouteCalculated]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    mapRef.current = L.map("map").setView([20.5937, 78.9629], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        driverPosRef.current = { lat: latitude, lng: longitude };

        if (!driverMarkerRef.current) {
          const driverIcon = L.icon({
            iconUrl: "/raider.jpg",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
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
  }, [customers, calculateOptimalRoute]);

  useEffect(() => {
    if (!mapRef.current || !driverPosRef.current) return;

    customerMarkersRef.current.forEach((marker) => marker.remove());
    customerMarkersRef.current = [];

    customers.forEach((customer) => {
      const customerIcon = L.icon({
        iconUrl: "/raider.jpg",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([customer.latitude, customer.longitude], { icon: customerIcon }).addTo(mapRef.current!);

      const popupContent = `
        <div class="space-y-1">
          <h4 class="font-bold">${customer.address || "Customer"}</h4>
          <p>Distance: ${customer.distance?.toFixed(2) || "0.00"} km</p>
          <p>ETA: ${customer.eta || calculateETA(customer.distance || 0)}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      customerMarkersRef.current.push(marker);
    });

    if (customers.length > 0 && driverPosRef.current) {
      calculateOptimalRoute(driverPosRef.current, customers);
    }
  }, [customers, calculateOptimalRoute, calculateETA]);

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
}
