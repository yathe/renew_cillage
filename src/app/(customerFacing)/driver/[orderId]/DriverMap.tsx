// F:\totally_new_cillage\renew_cillage\src\app\(customerFacing)\driver\[orderId]\DriverMap.tsx
"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface DriverMapProps {
  customers: Array<{
    id: string
    latitude: number
    longitude: number
    address?: string
    distance?: number
  }>
  onRouteCalculated: (distance: string) => void
}

export default function DriverMap({ customers, onRouteCalculated }: DriverMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const customerMarkersRef = useRef<L.Marker[]>([])
  const routeLineRef = useRef<L.Polyline | null>(null)
  const driverPosRef = useRef<{ lat: number; lng: number } | null>(null)

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return

    mapRef.current = L.map("map").setView([20.5937, 78.9629], 13)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap'
    }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
    }
  }, [])

  // Track driver position
  useEffect(() => {
    if (!mapRef.current || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        driverPosRef.current = { lat: latitude, lng: longitude }

        if (!driverMarkerRef.current) {
          const driverIcon = L.icon({
            iconUrl: "https://www.pngitem.com/pimgs/m/3-37779_transparent-delivery-png-delivery-boy-with-bike-png.png",
            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [0, -50]
          })
          driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon }).addTo(mapRef.current!)
        } else {
          driverMarkerRef.current.setLatLng([latitude, longitude])
        }

        // Calculate optimal route when driver moves
        if (customers.length > 0) {
          calculateOptimalRoute(driverPosRef.current, customers)
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [customers])

  // Update customer markers
  useEffect(() => {
    if (!mapRef.current || !driverPosRef.current) return

    // Clear existing customer markers
    customerMarkersRef.current.forEach(marker => marker.remove())
    customerMarkersRef.current = []

    // Add new customer markers
    customers.forEach(customer => {
      const customerIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      })

      const marker = L.marker([customer.latitude, customer.longitude], { icon: customerIcon })
        .addTo(mapRef.current!)
        .bindPopup(`${customer.address || "Customer"}<br>Distance: ${customer.distance?.toFixed(2) || "calculating"} km`)
      
      customerMarkersRef.current.push(marker)
    })

    // Calculate route if we have driver position
    if (driverPosRef.current && customers.length > 0) {
      calculateOptimalRoute(driverPosRef.current, customers)
    }
  }, [customers])

  const calculateOptimalRoute = (driverPos: { lat: number; lng: number }, customers: any[]) => {
    if (routeLineRef.current) {
      routeLineRef.current.remove()
    }

    // Simple nearest neighbor algorithm for routing
    const sortedCustomers = [...customers]
      .map(c => ({
        ...c,
        distance: haversineDistance(driverPos.lat, driverPos.lng, c.latitude, c.longitude)
      }))
      .sort((a, b) => a.distance - b.distance)

    const routePoints = [
      [driverPos.lat, driverPos.lng],
      ...sortedCustomers.map(c => [c.latitude, c.longitude])
    ]

    // Draw route
    routeLineRef.current = L.polyline(routePoints as any, {
      color: "#3498db",
      weight: 5,
      opacity: 0.7
    }).addTo(mapRef.current!)

    // Calculate total distance
    let totalDistance = 0
    for (let i = 0; i < routePoints.length - 1; i++) {
      const [lat1, lng1] = routePoints[i]
      const [lat2, lng2] = routePoints[i + 1]
      totalDistance += haversineDistance(lat1, lng1, lat2, lng2)
    }

    onRouteCalculated(`${totalDistance.toFixed(2)} km`)
    mapRef.current?.fitBounds(routeLineRef.current.getBounds())
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  return <div id="map" style={{ height: "100%", width: "100%" }} />
}