"use client"

import { useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapComponentProps {
  driverLocation: [number, number] | null
  customerLocation: [number, number] | null
  onRouteCalculated: (eta: string, distance: string) => void
}

export default function MapComponent({ 
  driverLocation, 
  customerLocation,
  onRouteCalculated
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const customerMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([20.5937, 78.9629], 5)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const calculateRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, end })
      })

      const data = await response.json()

      if (data.features?.[0]?.properties?.summary) {
        const summary = data.features[0].properties.summary
        const distanceKm = (summary.distance / 1000).toFixed(2)
        const etaMin = Math.round(summary.duration / 60)

        onRouteCalculated(`${etaMin} min`, `${distanceKm} km`)

        // Draw route on map
        const coordinates = data.features[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]]
        )

        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(coordinates)
        } else {
          routeLineRef.current = L.polyline(coordinates, {
            color: "#3498db",
            weight: 5,
            opacity: 0.7
          }).addTo(mapRef.current!)
        }

        // Fit map to route bounds
        const bounds = L.latLngBounds(coordinates)
        mapRef.current?.fitBounds(bounds)
      }
    } catch (error) {
      console.error("Route calculation error:", error)
    }
  }, [onRouteCalculated])

  useEffect(() => {
    if (!mapRef.current) return

    if (driverLocation) {
      if (!driverMarkerRef.current) {
        const driverIcon = L.icon({
          iconUrl: "/public/cus.jpg",
          iconSize: [50, 50],
          iconAnchor: [25, 50],
          popupAnchor: [0, -50]
        })

        driverMarkerRef.current = L.marker(driverLocation, {
          icon: driverIcon,
          zIndexOffset: 1000
        }).addTo(mapRef.current)
      } else {
        driverMarkerRef.current.setLatLng(driverLocation)
      }
    }

    if (customerLocation) {
      if (!customerMarkerRef.current) {
        const customerIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        })

        customerMarkerRef.current = L.marker(customerLocation, {
          icon: customerIcon
        }).addTo(mapRef.current)
      } else {
        customerMarkerRef.current.setLatLng(customerLocation)
      }
    }

    if (driverLocation && customerLocation) {
      calculateRoute(driverLocation, customerLocation)
    }
  }, [driverLocation, customerLocation, calculateRoute])

  return <div id="map" style={{ height: "100%", width: "100%" }} />
}
