// src/app/api/websocket/route.js
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const clients = new Map();

export async function GET(request) {
  if (!request.nextUrl.searchParams.get("orderId")) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  if (request.headers.get("upgrade") !== "websocket") {
    return NextResponse.json({ error: "Expected WebSocket" }, { status: 426 });
  }

  const orderId = request.nextUrl.searchParams.get("orderId");
  const { socket, response } = await (request as any).webSocket();

  if (!clients.has(orderId)) {
    clients.set(orderId, new Set());
  }
  const orderClients = clients.get(orderId);
  orderClients.add(socket);

  socket.onmessage = (event) => {
    // Broadcast to all other clients in the same order room
    orderClients.forEach(client => {
      if (client !== socket && client.readyState === 1) { // 1 = OPEN
        client.send(event.data);
      }
    });
  };

  socket.onclose = () => {
    orderClients.delete(socket);
    if (orderClients.size === 0) {
      clients.delete(orderId);
    }
  };

  return response;
}