import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;

  const backendUrl = `http://localhost:3001/api/driver-events/${orderId}`;

  const response = await fetch(backendUrl, {
    headers: request.headers,
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
