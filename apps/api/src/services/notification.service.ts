import type { OrderStatus } from '@prisma/client';
import { prisma } from '../db';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_TIMEOUT_MS = 2_147_483_647;

function truncateMessage(content: string, max = 100) {
  if (content.length <= max) return content;
  return `${content.slice(0, max - 1)}…`;
}

function isExpoPushToken(token: string) {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

const statusLabelFr: Record<OrderStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  searching: 'Recherche en cours',
  negotiating: 'Négociation',
  accepted: 'Acceptée',
  en_route: 'En route',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

async function removePushToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });

  if (!user) return;

  const nextTokens = user.pushTokens.filter((existingToken) => existingToken !== token);
  if (nextTokens.length === user.pushTokens.length) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      pushTokens: {
        set: nextTokens,
      },
    },
  });
}

async function sendToToken(
  userId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (!isExpoPushToken(token)) {
    await removePushToken(userId, token);
    return;
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      badge: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with status ${response.status}`);
  }

  const payload = await response.json() as {
    data?: {
      status?: 'ok' | 'error';
      details?: {
        error?: string;
      };
    };
  };

  if (payload.data?.status === 'error') {
    const errorType = payload.data.details?.error;
    if (errorType === 'DeviceNotRegistered') {
      await removePushToken(userId, token);
    } else {
      console.warn(`[push] Expo error for token ${token.slice(0, 25)}…: ${errorType ?? 'unknown'}`);
    }
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });

  if (!user || user.pushTokens.length === 0) return;

  await Promise.all(
    user.pushTokens.map(async (token) => {
      await sendToToken(userId, token, title, body, data);
    }),
  );
}

export async function notifyNewMessage(orderId: string, senderId: string, content: string) {
  const [order, sender] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        clientId: true,
        assignments: {
          select: {
            professional: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: senderId },
      select: { fullName: true },
    }),
  ]);

  if (!order) return;

  const participantIds = new Set<string>([
    order.clientId,
    ...order.assignments.map((assignment) => assignment.professional.userId),
  ]);

  participantIds.delete(senderId);

  await Promise.all(
    [...participantIds].map((recipientId) => sendPushNotification(
      recipientId,
      sender?.fullName ?? 'Nouveau message',
      truncateMessage(content),
      { type: 'message', orderId },
    )),
  );
}

export async function notifyStatusChange(orderId: string, _fromStatus: string, toStatus: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      clientId: true,
      assignments: {
        select: {
          professional: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!order) return;

  const recipients = new Set<string>([
    order.clientId,
    ...order.assignments.map((assignment) => assignment.professional.userId),
  ]);

  const typedStatus = toStatus as OrderStatus;
  const statusLabel = statusLabelFr[typedStatus] ?? toStatus;

  await Promise.all(
    [...recipients].map((recipientId) => sendPushNotification(
      recipientId,
      'Commande mise à jour',
      `Statut: ${statusLabel}`,
      { type: 'status', orderId, status: toStatus },
    )),
  );
}

export async function notifyNewOffer(orderId: string, proUserId: string) {
  await sendPushNotification(
    proUserId,
    'Nouvelle mission',
    'Vous avez été assigné à une nouvelle mission',
    { type: 'offer', orderId },
  );
}

export async function notifyRatePrompt(orderId: string, clientUserId: string) {
  await sendPushNotification(
    clientUserId,
    'Évaluez le service',
    'Comment s\'est passé votre service ?',
    { type: 'rate', orderId },
  );
}

export async function scheduleServiceReminder(
  orderId: string,
  proUserId: string,
  scheduledStartAt: Date,
) {
  const reminderAt = scheduledStartAt.getTime() - (60 * 60 * 1000);
  const delayMs = reminderAt - Date.now();

  if (delayMs <= 0 || delayMs > MAX_TIMEOUT_MS) return;

  const timer = setTimeout(() => {
    sendPushNotification(
      proUserId,
      'Rappel de mission',
      'Votre mission commence dans 1 heure',
      { type: 'reminder', orderId },
    ).catch(console.error);
  }, delayMs);

  timer.unref?.();
}
