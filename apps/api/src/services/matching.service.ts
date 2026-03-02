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
  order: { serviceType: string; location: string },
  db: DbClient = prisma,
): Promise<Professional | null> {
  const zoneTokens = extractZoneTokens(order.location);
  const prosBySkill = await db.professional.findMany({
    where: {
      isAvailable: true,
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
    where: { isAvailable: true },
    orderBy: [
      { reliability: 'desc' },
      { rating: 'desc' },
    ],
  });
}
