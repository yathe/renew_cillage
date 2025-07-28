// F:\totally_new_cillage\renew_cillage\src\app\api\geocode\route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { address } = await request.json()

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    )
    const data = await response.json()

    if (data.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const { lat, lon } = data[0]
    return NextResponse.json({ 
      latitude: parseFloat(lat), 
      longitude: parseFloat(lon) 
    })
  } catch (err) {
    console.error("Geocoding error:", err)
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 })
  }
}