// src/app/api/customer-location/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  
  // Forward to your backend service
  const backendResponse = await fetch('http://localhost:3001/api/customer-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return NextResponse.json(await backendResponse.json());
}