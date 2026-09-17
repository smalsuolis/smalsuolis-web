import { describe, expect, it } from 'vitest';
import { formatCoordinate, parseCoordinate, toLks94 } from './coordinates';

// Vilnius Cathedral, and the same place in LKS94 metres.
const LNG = 25.2877;
const LAT = 54.6859;
const X = 583029;
const Y = 6061813;

const near = (actual: number, expected: number, tolerance = 1e-4) =>
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);

describe('parseCoordinate', () => {
  it('reads a WGS84 pair written latitude first', () => {
    const r = parseCoordinate(`${LAT}, ${LNG}`);
    expect(r?.system).toBe('WGS84');
    near(r!.lat, LAT);
    near(r!.lng, LNG);
  });

  // The two orders are indistinguishable by shape — only one of them is in
  // Lithuania, which is the whole reason the bounds check exists.
  it('reads the same pair written longitude first', () => {
    const r = parseCoordinate(`${LNG}, ${LAT}`);
    near(r!.lat, LAT);
    near(r!.lng, LNG);
  });

  it.each([
    ['comma', `${LAT},${LNG}`],
    ['space', `${LAT} ${LNG}`],
    ['comma and spaces', `  ${LAT} ,  ${LNG} `],
    ['semicolon', `${LAT};${LNG}`],
    ['brackets', `[${LAT}, ${LNG}]`],
  ])('accepts a pair separated by %s', (_name, input) => {
    near(parseCoordinate(input)!.lat, LAT);
  });

  it('reads LKS94 metres and converts them to degrees', () => {
    const r = parseCoordinate(`${X} ${Y}`);
    expect(r?.system).toBe('LKS94');
    near(r!.lat, LAT, 1e-3);
    near(r!.lng, LNG, 1e-3);
  });

  it('reads LKS94 with northing first', () => {
    const r = parseCoordinate(`${Y} ${X}`);
    expect(r?.system).toBe('LKS94');
    near(r!.lat, LAT, 1e-3);
  });

  it.each([
    ['a point outside Lithuania', '1, 2'],
    ['the null island', '0,0'],
    ['a street name', 'Vilniaus g. 2'],
    ['a lone number', '54.6872'],
    ['a house number that looks like a pair', 'Kalvarijų 125'],
    ['empty input', ''],
    ['three numbers', '54.6, 25.2, 100'],
  ])('rejects %s', (_name, input) => {
    expect(parseCoordinate(input)).toBeNull();
  });

  // Klaipėda and Zarasai — opposite corners, to catch bounds that are too tight.
  it.each([
    ['Klaipėda', 55.7033, 21.1443],
    ['Zarasai', 55.7314, 26.2453],
    ['Druskininkai', 54.0163, 23.9707],
  ])('accepts %s', (_name, lat, lng) => {
    const r = parseCoordinate(`${lat}, ${lng}`);
    expect(r).not.toBeNull();
    near(r!.lat, lat);
  });
});

describe('toLks94', () => {
  it('round-trips a point back to where it started', () => {
    const [x, y] = toLks94(LNG, LAT);
    expect(Math.round(x)).toBe(X);
    expect(Math.round(y)).toBe(Y);
  });
});

describe('formatCoordinate', () => {
  it('writes latitude first, which is the order people paste', () => {
    expect(formatCoordinate({ lng: LNG, lat: LAT, system: 'WGS84' })).toBe('54.68590, 25.28770');
  });
});
