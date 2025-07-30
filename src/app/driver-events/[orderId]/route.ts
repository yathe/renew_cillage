// src/app/api/driver-events/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  // Connect to your backend service (running on port 3001)
  const backendUrl = `http://localhost:3001/api/driver-events/${params.orderId}`;
  
  // Forward the request to your backend
  const response = await fetch(backendUrl, {
    headers: request.headers
  });

  // Return the backend response
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}