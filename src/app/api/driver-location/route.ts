import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { orderId, latitude, longitude } = body;

  // Forward this to your backend service
  const backendResponse = await fetch(`http://localhost:3001/api/driver-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, latitude, longitude })
  });

  return NextResponse.json(await backendResponse.json());
}