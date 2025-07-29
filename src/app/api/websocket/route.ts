// src/app/api/websocket/route.ts
import { NextRequest, NextResponse } from "next/server"
import { WebSocketServer } from "ws"

export const dynamic = "force-dynamic" // Required for WebSockets

const wss = new WebSocketServer({ noServer: true })
const clients = new Map()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 })
  }

  if (request.headers.get("upgrade") !== "websocket") {
    return NextResponse.json({ error: "Expected WebSocket upgrade" }, { status: 426 })
  }

  const { socket, response } = (request as any).webSocket()

  if (!clients.has(orderId)) {
    clients.set(orderId, new Set())
  }
  clients.get(orderId).add(socket)

  socket.on("close", () => {
    clients.get(orderId)?.delete(socket)
    if (clients.get(orderId)?.size === 0) {
      clients.delete(orderId)
    }
  })

  socket.on("message", (data) => {
    const message = JSON.parse(data.toString())
    clients.get(orderId)?.forEach((client) => {
      if (client !== socket && client.readyState === 1) {
        client.send(JSON.stringify(message))
      }
    })
  })

  return response
}