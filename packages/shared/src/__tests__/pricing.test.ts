import { describe, it, expect } from 'vitest';
import { computeMenagePrice } from '../pricing/menage';
import { computeCuisinePrice } from '../pricing/cuisine';
import { computeChildcarePrice } from '../pricing/childcare';
import { computePrice } from '../pricing';
import { CleanType, TeamType, ServiceType } from '../types/enums';

describe('Ménage pricing', () => {
  // Surface bracket boundaries
  it('40m² solo simple = 80 MAD', () => {
    expect(
      computeMenagePrice({ surface: 40, teamType: 'solo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(80);
  });

  it('41m² solo simple = 100 MAD (next bracket)', () => {
    expect(
      computeMenagePrice({ surface: 41, teamType: 'solo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(100);
  });

  it('70m² solo simple = 100 MAD', () => {
    expect(
      computeMenagePrice({ surface: 70, teamType: 'solo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(100);
  });

  it('70m² duo simple = 140 MAD', () => {
    expect(
      computeMenagePrice({ surface: 70, teamType: 'duo', cleanType: 'simple' })
        .floorPrice,
    ).toBe(140);
  });

  it('110m² solo simple = 130 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 110,
        teamType: 'solo',
        cleanType: 'simple',
      }).floorPrice,
    ).toBe(130);
  });

  it('160m² squad(3) simple = 300 MAD (squad minimum pay)', () => {
    // surface-based squad price = 270, but squad min = 3 * 100 = 300
    expect(
      computeMenagePrice({
        surface: 160,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 3,
      }).floorPrice,
    ).toBe(300);
  });

  it('220m² squad(4) simple = max(320, 400) = 400 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 220,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 4,
      }).floorPrice,
    ).toBe(400);
  });

  it('300m² squad(3) simple = 400 MAD (surface > squad min)', () => {
    // surface-based = 400, squad min = 300 → 400
    expect(
      computeMenagePrice({
        surface: 300,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 3,
      }).floorPrice,
    ).toBe(400);
  });

  // Deep clean multiplier
  it('80m² solo deep = round(130 * 1.35) = 176 MAD', () => {
    expect(
      computeMenagePrice({ surface: 80, teamType: 'solo', cleanType: 'deep' })
        .floorPrice,
    ).toBe(176);
  });

  it('40m² solo deep = round(80 * 1.35) = 108 MAD', () => {
    expect(
      computeMenagePrice({ surface: 40, teamType: 'solo', cleanType: 'deep' })
        .floorPrice,
    ).toBe(108);
  });

  // Over 300m² surcharge
  it('350m² solo simple = 260 + ceil(50/50)*35 = 295 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 350,
        teamType: 'solo',
        cleanType: 'simple',
      }).floorPrice,
    ).toBe(295);
  });

  it('400m² duo simple = 320 + ceil(100/50)*45 = 410 MAD', () => {
    expect(
      computeMenagePrice({
        surface: 400,
        teamType: 'duo',
        cleanType: 'simple',
      }).floorPrice,
    ).toBe(410);
  });

  it('500m² squad(5) simple = max(400 + ceil(200/50)*55, 5*100) = max(620,500) = 620', () => {
    expect(
      computeMenagePrice({
        surface: 500,
        teamType: 'squad',
        cleanType: 'simple',
        squadSize: 5,
      }).floorPrice,
    ).toBe(620);
  });

  // Ceiling
  it('ceiling = round(floorPrice * 2.5)', () => {
    const result = computeMenagePrice({
      surface: 100,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.ceiling).toBe(Math.round(result.floorPrice * 2.5));
  });

  // Duration estimates
  it('returns duration range', () => {
    const result = computeMenagePrice({
      surface: 80,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.durationMinutes.min).toBeGreaterThan(0);
    expect(result.durationMinutes.max).toBeGreaterThan(
      result.durationMinutes.min,
    );
  });
});

describe('Cuisine pricing', () => {
  it('1 guest = 100 MAD', () => {
    expect(computeCuisinePrice({ guests: 1 }).floorPrice).toBe(100);
  });

  it('4 guests = 100 MAD', () => {
    expect(computeCuisinePrice({ guests: 4 }).floorPrice).toBe(100);
  });

  it('5 guests = 130 MAD', () => {
    expect(computeCuisinePrice({ guests: 5 }).floorPrice).toBe(130);
  });

  it('7 guests = 130 MAD', () => {
    expect(computeCuisinePrice({ guests: 7 }).floorPrice).toBe(130);
  });

  it('8 guests = 165 MAD', () => {
    expect(computeCuisinePrice({ guests: 8 }).floorPrice).toBe(165);
  });

  it('10 guests = 165 MAD', () => {
    expect(computeCuisinePrice({ guests: 10 }).floorPrice).toBe(165);
  });

  it('11 guests = 165 + ceil(1/3)*25 = 190 MAD', () => {
    expect(computeCuisinePrice({ guests: 11 }).floorPrice).toBe(190);
  });

  it('13 guests = 165 + ceil(3/3)*25 = 190 MAD', () => {
    expect(computeCuisinePrice({ guests: 13 }).floorPrice).toBe(190);
  });

  it('14 guests = 165 + ceil(4/3)*25 = 215 MAD', () => {
    expect(computeCuisinePrice({ guests: 14 }).floorPrice).toBe(215);
  });

  it('20 guests = 165 + ceil(10/3)*25 = 265 MAD', () => {
    expect(computeCuisinePrice({ guests: 20 }).floorPrice).toBe(265);
  });
});

describe('Childcare pricing', () => {
  it('1 child, 1 hour = 80 MAD', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 1 }).floorPrice,
    ).toBe(80);
  });

  it('1 child, 2 hours = 80 MAD (no extra for first 2h)', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 2 }).floorPrice,
    ).toBe(80);
  });

  it('1 child, 3 hours = 80 + 1*1*25 = 105 MAD', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 3 }).floorPrice,
    ).toBe(105);
  });

  it('2 children, 4 hours = 2*80 + 2*2*25 = 260 MAD', () => {
    expect(
      computeChildcarePrice({ children: 2, hours: 4 }).floorPrice,
    ).toBe(260);
  });

  it('6 children, 12 hours = 6*80 + 6*10*25 = 1980 MAD', () => {
    expect(
      computeChildcarePrice({ children: 6, hours: 12 }).floorPrice,
    ).toBe(1980);
  });
});

describe('computePrice dispatcher', () => {
  it('dispatches menage', () => {
    const result = computePrice(ServiceType.MENAGE, {
      surface: 40,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(80);
  });

  it('dispatches cuisine', () => {
    const result = computePrice(ServiceType.CUISINE, { guests: 4 });
    expect(result.floorPrice).toBe(100);
  });

  it('dispatches childcare', () => {
    const result = computePrice(ServiceType.CHILDCARE, {
      children: 1,
      hours: 1,
    });
    expect(result.floorPrice).toBe(80);
  });
});
