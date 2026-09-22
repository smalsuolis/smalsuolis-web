import { describe, expect, it } from 'vitest';
import { buildTagRows, formatStatValue } from './statsRows';

const TAGS = {
  'Plynas kirtimas': { count: 10, area: 40.5, calculatedArea: 40.5 },
  Retinimas: { count: 30, area: 8, calculatedArea: 2 },
};

const PREV = {
  'Plynas kirtimas': { count: 4, area: 30.5, calculatedArea: 30.5 },
  Retinimas: { count: 30, area: 8, calculatedArea: 2 },
};

describe('buildTagRows', () => {
  it('counts permits and sorts by the count', () => {
    const rows = buildTagRows(TAGS, undefined, 'count');
    expect(rows.map((r) => r.label)).toEqual(['Retinimas', 'Plynas kirtimas']);
    expect(rows[0].count).toBe(30);
    expect(rows[0].total).toBe(40);
  });

  // The two metrics do not rank the same: Retinimas issues three times the
  // permits of Plynas kirtimas over a fifth of the area.
  it('sums hectares and re-sorts by the area', () => {
    const rows = buildTagRows(TAGS, undefined, 'area');
    expect(rows.map((r) => r.label)).toEqual(['Plynas kirtimas', 'Retinimas']);
    expect(rows[0].count).toBe(40.5);
    expect(rows[0].total).toBe(48.5);
  });

  it('carries the previous period in the metric being shown', () => {
    expect(buildTagRows(TAGS, PREV, 'count')[1].previousCount).toBe(4);
    expect(buildTagRows(TAGS, PREV, 'area')[0].previousCount).toBe(30.5);
  });

  it('treats a tag with no hectares as zero rather than dropping it', () => {
    const rows = buildTagRows({ 'Be ploto': { count: 5 } }, undefined, 'area');
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(0);
  });

  it('returns nothing when there is no data', () => {
    expect(buildTagRows(undefined, undefined, 'count')).toEqual([]);
  });
});

describe('formatStatValue', () => {
  it('writes a count as a plain grouped number', () => {
    expect(formatStatValue(59211, 'count')).toBe((59211).toLocaleString('lt-LT'));
  });

  it('writes an area with two decimals and a unit', () => {
    expect(formatStatValue(128625.766, 'area')).toBe(
      `${(128625.77).toLocaleString('lt-LT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ha`,
    );
  });

  // The whole point of the 'area' branch: a bare toLocaleString would round
  // 128 625,766 to 128 626 and drop the unit the number is meaningless without.
  it('keeps the decimals and the unit an area needs', () => {
    const formatted = formatStatValue(128625.766, 'area');
    expect(formatted).toMatch(/,77 ha$/);
  });
});
