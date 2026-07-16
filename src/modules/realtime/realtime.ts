import type { Server } from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';

const channels = new Map<string, Set<WebSocket>>();

function send(socket: WebSocket, payload: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
}

export function broadcast(channel: string, payload: unknown) {
  for (const socket of channels.get(channel) ?? []) send(socket, payload);
}

export function attachRealtimeServer(server: Server) {
  const webSocketServer = new WebSocketServer({ server, path: '/ws' });

  webSocketServer.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '/ws', 'http://localhost');
    const channel = url.searchParams.get('channel') ?? 'community';
    const sockets = channels.get(channel) ?? new Set<WebSocket>();
    sockets.add(socket);
    channels.set(channel, sockets);
    send(socket, { type: 'connected', channel });
    broadcast(channel, { type: 'presence', channel, count: sockets.size });

    socket.on('message', (data) => {
      try {
        const payload = JSON.parse(String(data));
        broadcast(channel, payload);
      } catch {
        send(socket, { type: 'error', message: 'Invalid websocket payload' });
      }
    });

    socket.on('close', () => {
      sockets.delete(socket);
      broadcast(channel, { type: 'presence', channel, count: sockets.size });
      if (sockets.size === 0) channels.delete(channel);
    });
  });

  return webSocketServer;
}
