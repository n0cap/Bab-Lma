import type { Prisma, Professional } from '@prisma/client';
import { prisma } from '../db';

type DbClient = Prisma.TransactionClient | typeof prisma;

function normalizeToken(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function extractZoneTokens(location: string) {
  return location
    .split(/[,\s-]+/g)
    .map((token) => normalizeToken(token))
    .filter(Boolean);
}

export async function matchPro(
  order: {
    serviceType: string;
    location: string;
    detail?: {
      teamType?: string | null;
    } | null;
  },
  db: DbClient = prisma,
): Promise<Professional | null> {
  let teamType = order.detail?.teamType?.toLowerCase() ?? null;
  if (!teamType) {
    // Fallback heuristic: infer from the latest in-flight order with the same service/location.
    // This can mis-associate in dense areas but keeps WS12 behavior without changing order.service.ts.
    const matchingOrder = await db.order.findFirst({
      where: {
        serviceType: order.serviceType as any,
        location: order.location,
        status: { in: ['submitted', 'searching', 'negotiating'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        detail: {
          select: {
            teamType: true,
          },
        },
      },
    });
    teamType = matchingOrder?.detail?.teamType?.toLowerCase() ?? null;
  }

  const requireTeamLead = teamType === 'duo' || teamType === 'squad';
  const zoneTokens = extractZoneTokens(order.location);
  const prosBySkill = await db.professional.findMany({
    where: {
      isAvailable: true,
      ...(requireTeamLead ? { isTeamLead: true } : {}),
      skills: { has: order.serviceType as any },
    },
    orderBy: [
      { reliability: 'desc' },
      { rating: 'desc' },
    ],
  });

  const zoneMatch = prosBySkill.find((pro) => {
    const normalizedZones = pro.zones.map((zone) => normalizeToken(zone));
    return normalizedZones.some((zone) => zoneTokens.includes(zone));
  });

  const selected = zoneMatch ?? prosBySkill[0] ?? null;
  if (selected) {
    return selected;
  }

  return db.professional.findFirst({
    where: {
      isAvailable: true,
      ...(requireTeamLead ? { isTeamLead: true } : {}),
    },
    orderBy: [
      { reliability: 'desc' },
      { rating: 'desc' },
    ],
  });
}
