import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Required for WebSockets

const clients = new Map<string, Set<WebSocket>>();

interface WebSocketRequest extends NextRequest {
  webSocket: () => { socket: WebSocket; response: Response };
}

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  if (request.headers.get("upgrade") !== "websocket") {
    return NextResponse.json({ error: "Expected WebSocket upgrade" }, { status: 426 });
  }

  const { socket, response } = (request as WebSocketRequest).webSocket();

  if (!clients.has(orderId)) {
    clients.set(orderId, new Set());
  }
  clients.get(orderId)!.add(socket);

  socket.onclose = () => {
    clients.get(orderId)?.delete(socket);
    if (clients.get(orderId)?.size === 0) {
      clients.delete(orderId);
    }
  };

  socket.onmessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data.toString());

      clients.get(orderId)?.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };

  return response;
}
