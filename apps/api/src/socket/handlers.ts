import type { Socket, Server } from 'socket.io';
import { withAuth } from './auth';
import * as negotiationService from '../services/negotiation.service';
import { isValidTransition } from '@babloo/shared';
import { prisma } from '../db';

function roomName(orderId: string) {
  return `order:${orderId}`;
}

// ── join:order ─────────────────────────────────────────────

async function handleJoinOrder(socket: Socket, payload: { orderId: string }) {
  const { orderId } = payload;
  if (!orderId) return;

  try {
    await negotiationService.checkParticipant(socket.data.userId, orderId);
    socket.join(roomName(orderId));
    socket.emit('order:joined', { orderId });
  } catch {
    socket.emit('error', { message: 'Accès non autorisé à cette commande' });
  }
}

// ── leave:order ────────────────────────────────────────────

function handleLeaveOrder(socket: Socket, payload: { orderId: string }) {
  if (payload?.orderId) {
    socket.leave(roomName(payload.orderId));
  }
}

// ── message:send ───────────────────────────────────────────

async function handleMessageSend(
  socket: Socket,
  io: Server,
  payload: { orderId: string; content: string; clientMessageId?: string },
) {
  const { orderId, content, clientMessageId } = payload;
  if (!orderId || !content) return;

  try {
    const { participantRole } = await negotiationService.checkParticipant(
      socket.data.userId,
      orderId,
    );

    const message = await negotiationService.sendMessage(
      socket.data.userId,
      orderId,
      content.trim().slice(0, 2000),
      participantRole,
      clientMessageId,
    );

    io.to(roomName(orderId)).emit('message:new', message);
  } catch (err: any) {
    socket.emit('error', { message: err?.message ?? 'Erreur lors de l\'envoi du message' });
  }
}

// ── typing:start ───────────────────────────────────────────

function handleTypingStart(socket: Socket, payload: { orderId: string }) {
  if (!payload?.orderId) return;
  socket.to(roomName(payload.orderId)).emit('typing:indicator', {
    userId: socket.data.userId,
    orderId: payload.orderId,
  });
}

// ── offer:create ───────────────────────────────────────────

async function handleOfferCreate(
  socket: Socket,
  io: Server,
  payload: { orderId: string; amount: number },
) {
  const { orderId, amount } = payload;
  if (!orderId || typeof amount !== 'number') return;

  try {
    const { order } = await negotiationService.checkParticipant(
      socket.data.userId,
      orderId,
    );

    const offer = await negotiationService.createOffer(
      socket.data.userId,
      orderId,
      amount,
      order,
    );

    io.to(roomName(orderId)).emit('offer:new', offer);
  } catch (err: any) {
    socket.emit('error', { message: err?.message ?? 'Erreur lors de la création de l\'offre' });
  }
}

// ── offer:accept ───────────────────────────────────────────

async function handleOfferAccept(
  socket: Socket,
  io: Server,
  payload: { orderId: string; offerId: string },
) {
  const { orderId, offerId } = payload;
  if (!orderId || !offerId) return;

  try {
    const { order, participantRole } = await negotiationService.checkParticipant(
      socket.data.userId,
      orderId,
    );

    const result = await negotiationService.acceptOffer(
      socket.data.userId,
      orderId,
      offerId,
      order,
      participantRole,
    );

    io.to(roomName(orderId)).emit('offer:accepted', result.offer);
    io.to(roomName(orderId)).emit('order:updated', result.order);
  } catch (err: any) {
    socket.emit('error', { message: err?.message ?? 'Erreur lors de l\'acceptation' });
  }
}

// ── status:update ──────────────────────────────────────────

async function handleStatusUpdate(
  socket: Socket,
  io: Server,
  payload: { orderId: string; toStatus: string; reason?: string },
) {
  const { orderId, toStatus, reason } = payload;
  if (!orderId || !toStatus) return;

  try {
    const { order, participantRole } = await negotiationService.checkParticipant(
      socket.data.userId,
      orderId,
    );

    if (!isValidTransition(order.status as any, toStatus as any)) {
      socket.emit('error', { message: 'Transition de statut invalide' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus as any },
        include: { detail: true },
      });

      await tx.statusEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: toStatus as any,
          actorUserId: socket.data.userId,
          actorRole: participantRole,
          reason: reason ?? null,
        },
      });

      return updatedOrder;
    });

    io.to(roomName(orderId)).emit('order:updated', updated);
  } catch (err: any) {
    socket.emit('error', { message: err?.message ?? 'Erreur lors de la mise à jour du statut' });
  }
}

// ── Register all handlers ──────────────────────────────────

export function registerHandlers(io: Server, socket: Socket) {
  socket.on('join:order', withAuth(socket, (p) => handleJoinOrder(socket, p)));
  socket.on('leave:order', (p) => handleLeaveOrder(socket, p));
  socket.on('message:send', withAuth(socket, (p) => handleMessageSend(socket, io, p)));
  socket.on('typing:start', (p) => handleTypingStart(socket, p));
  socket.on('offer:create', withAuth(socket, (p) => handleOfferCreate(socket, io, p)));
  socket.on('offer:accept', withAuth(socket, (p) => handleOfferAccept(socket, io, p)));
  socket.on('status:update', withAuth(socket, (p) => handleStatusUpdate(socket, io, p)));
}
