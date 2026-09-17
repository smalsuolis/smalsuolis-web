import proj4 from 'proj4';

// The map iframe draws incoming geometry in EPSG:3346 (LKS94), hardcoded in its
// route, and proj4 does not ship the definition. Registering it here rather than
// at each call site keeps one copy of the string: a mistyped parameter would not
// fail, it would quietly place points tens of metres off.
proj4.defs(
  'EPSG:3346',
  '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9998 +x_0=500000 +y_0=0 ' +
    '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);

/** WGS84 degrees to LKS94 metres, for anything sent to the map iframe. */
export function toLks94(lng: number, lat: number): [number, number] {
  return proj4('EPSG:4326', 'EPSG:3346', [lng, lat]) as [number, number];
}

// Lithuania in WGS84, padded to the nearest tenth of a degree. Used to tell a
// latitude from a longitude rather than to reject foreign places: the map only
// ever holds Lithuanian data, so a pair outside these bounds is a typo, not a
// destination.
const LT_WGS84 = { minLng: 20.8, maxLng: 26.9, minLat: 53.8, maxLat: 56.5 };

// The same country in LKS94 (EPSG:3346) metres. The two systems cannot be
// confused by value — an LKS94 easting is five orders of magnitude larger than
// any longitude — which is what lets one field accept both.
const LT_LKS94 = { minX: 300000, maxX: 700000, minY: 5950000, maxY: 6300000 };

// Two numbers separated by a comma or whitespace. The decimal separator is a
// dot: a comma is already the pair separator, and "54,68 25,28" cannot be told
// apart from two integer pairs without guessing. Everything people paste from
// geoportal.lt and Regia uses dots.
const NUMBER = String.raw`-?\d+(?:\.\d+)?`;
const PAIR = new RegExp(`^(${NUMBER})[\\s,;]+(${NUMBER})$`);

export type CoordinateSystem = 'WGS84' | 'LKS94';

export interface ParsedCoordinate {
  lng: number;
  lat: number;
  system: CoordinateSystem;
}

const inWgs84 = (lng: number, lat: number) =>
  lng >= LT_WGS84.minLng &&
  lng <= LT_WGS84.maxLng &&
  lat >= LT_WGS84.minLat &&
  lat <= LT_WGS84.maxLat;

const inLks94 = (x: number, y: number) =>
  x >= LT_LKS94.minX && x <= LT_LKS94.maxX && y >= LT_LKS94.minY && y <= LT_LKS94.maxY;

/**
 * Reads a coordinate pair typed into the address field, in either WGS84
 * degrees or LKS94 metres.
 *
 * Both orders are accepted for both systems. Which one was meant is decided by
 * which one lands in Lithuania, not by the order itself — people paste
 * "lat, lng" from one source and "x y" from another, and a silent swap puts the
 * pin in the Gulf of Guinea with nothing on screen to say so. When neither
 * order fits, this returns null and the caller falls back to searching the text
 * as an address.
 */
export function parseCoordinate(input: string): ParsedCoordinate | null {
  const match = input
    .trim()
    .replace(/[[\]()]/g, '')
    .match(PAIR);
  if (!match) return null;

  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  if (!isFinite(a) || !isFinite(b)) return null;

  if (inWgs84(b, a)) return { lng: b, lat: a, system: 'WGS84' };
  if (inWgs84(a, b)) return { lng: a, lat: b, system: 'WGS84' };

  for (const [x, y] of [
    [a, b],
    [b, a],
  ]) {
    if (!inLks94(x, y)) continue;
    // proj4 is untyped here, and a projection it cannot resolve returns NaN
    // rather than throwing — which would put the pin nowhere with no error.
    const [lng, lat] = proj4('EPSG:3346', 'EPSG:4326', [x, y]) as [number, number];
    if (!isFinite(lng) || !isFinite(lat)) return null;
    return { lng, lat, system: 'LKS94' };
  }

  return null;
}

/** How a parsed pair is written back into the field and the recent-search list. */
export function formatCoordinate({ lng, lat }: ParsedCoordinate): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
