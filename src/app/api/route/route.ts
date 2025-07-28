// F:\totally_new_cillage\renew_cillage\src\app\api\route\route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { start, end } = await request.json()

  try {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.OPENROUTESERVICE_API_KEY || ""
      },
      body: JSON.stringify({
        coordinates: [
          [start[1], start[0]], // OpenRouteService expects [lon, lat]
          [end[1], end[0]]
        ]
      })
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Routing error:", error)
    return NextResponse.json({ error: "Routing failed" }, { status: 500 })
  }
}