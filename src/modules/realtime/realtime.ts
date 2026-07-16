import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { z } from 'zod';
import type { AuthUser } from '@/modules/auth/auth.middleware.js';
import { authenticateToken } from '@/modules/auth/auth.middleware.js';
import prisma from '@/config/prisma.js';

const channels = new Map<string, Set<WebSocket>>();
const socketChannels = new WeakMap<WebSocket, Set<string>>();
const socketUsers = new WeakMap<WebSocket, AuthUser>();
const authMessageSchema = z.object({ type: z.literal('auth'), token: z.string().min(1).max(10000) });
const subscribeMessageSchema = z.object({ type: z.literal('subscribe'), channel: z.string().min(1).max(160) });
const unsubscribeMessageSchema = z.object({ type: z.literal('unsubscribe'), channel: z.string().min(1).max(160) });
const typingMessageSchema = z.object({ type: z.literal('care-chat:typing'), sessionId: z.string().cuid(), isTyping: z.boolean() });
const readMessageSchema = z.object({ type: z.literal('care-chat:read'), sessionId: z.string().cuid(), messageId: z.string().cuid() });

function send(socket: WebSocket, payload: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
}

export function broadcast(channel: string, payload: unknown) {
  for (const socket of channels.get(channel) ?? []) send(socket, payload);
}

function leave(socket: WebSocket, channel: string) {
  const sockets = channels.get(channel);
  sockets?.delete(socket);
  socketChannels.get(socket)?.delete(channel);
  if (sockets?.size === 0) channels.delete(channel);
}

function join(socket: WebSocket, channel: string) {
  const sockets = channels.get(channel) ?? new Set<WebSocket>();
  sockets.add(socket);
  channels.set(channel, sockets);
  const subscriptions = socketChannels.get(socket) ?? new Set<string>();
  subscriptions.add(channel);
  socketChannels.set(socket, subscriptions);
}

async function authorizeChannel(user: AuthUser, channel: string) {
  if (channel === 'community') return true;
  if (channel === 'care') return user.role === 'PSYCHOLOGIST' || user.role === 'ADMIN';
  if (channel === `user:${user.id}:care`) return true;
  const match = channel.match(/^care-chat:([a-z0-9]+)$/);
  if (!match?.[1]) return false;
  const session = await prisma.careChatSession.findFirst({ where: { id: match[1], OR: [{ userId: user.id }, { psychologistId: user.id }] }, select: { id: true } });
  return Boolean(session);
}

async function requireChatMembership(userId: string, sessionId: string) {
  return prisma.careChatSession.findFirst({ where: { id: sessionId, OR: [{ userId }, { psychologistId: userId }] }, select: { id: true } });
}

export function attachRealtimeServer(server: Server) {
  const webSocketServer = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
  webSocketServer.on('connection', (socket) => {
    let authenticated = false;
    const authenticationTimeout = setTimeout(() => socket.close(4401, 'Authentication required'), 10000);

    socket.on('message', async (data) => {
      try {
        const raw = JSON.parse(String(data)) as unknown;
        if (!authenticated) {
          const auth = authMessageSchema.parse(raw);
          const user = await authenticateToken(auth.token);
          socketUsers.set(socket, user);
          authenticated = true;
          clearTimeout(authenticationTimeout);
          send(socket, { type: 'authenticated', userId: user.id });
          return;
        }

        const user = socketUsers.get(socket);
        if (!user) throw new Error('UNAUTHENTICATED');
        const type = z.object({ type: z.string() }).parse(raw).type;
        if (type === 'subscribe') {
          const message = subscribeMessageSchema.parse(raw);
          if (!await authorizeChannel(user, message.channel)) throw new Error('FORBIDDEN');
          join(socket, message.channel);
          send(socket, { type: 'subscribed', channel: message.channel });
          return;
        }
        if (type === 'unsubscribe') {
          const message = unsubscribeMessageSchema.parse(raw);
          leave(socket, message.channel);
          send(socket, { type: 'unsubscribed', channel: message.channel });
          return;
        }
        if (type === 'care-chat:typing') {
          const message = typingMessageSchema.parse(raw);
          if (!await requireChatMembership(user.id, message.sessionId)) throw new Error('FORBIDDEN');
          broadcast(`care-chat:${message.sessionId}`, { ...message, userId: user.id });
          return;
        }
        if (type === 'care-chat:read') {
          const message = readMessageSchema.parse(raw);
          if (!await requireChatMembership(user.id, message.sessionId)) throw new Error('FORBIDDEN');
          const updated = await prisma.careChatMessage.updateMany({ where: { id: message.messageId, sessionId: message.sessionId, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });
          if (updated.count !== 1) throw new Error('NOT_FOUND');
          broadcast(`care-chat:${message.sessionId}`, { ...message, userId: user.id, readAt: new Date().toISOString() });
          return;
        }
        throw new Error('INVALID_WEBSOCKET_EVENT');
      } catch (error) {
        const message = error instanceof Error && ['FORBIDDEN', 'UNAUTHENTICATED', 'NOT_FOUND'].includes(error.message) ? error.message : 'INVALID_WEBSOCKET_EVENT';
        send(socket, { type: 'error', message });
      }
    });

    socket.on('close', () => {
      clearTimeout(authenticationTimeout);
      for (const channel of socketChannels.get(socket) ?? []) leave(socket, channel);
    });
  });
  return webSocketServer;
}
