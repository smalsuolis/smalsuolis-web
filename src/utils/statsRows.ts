import { orderBy } from 'lodash';
import type { BreakdownRow } from '../components/stats/BreakdownCard';

// What a breakdown card is counting. Only miskoKirtimai carries hectares, so
// only that card ever switches; every other card stays on 'count'.
export type StatMetric = 'count' | 'area';

export type TagStats = Record<string, { count: number; area?: number; calculatedArea?: number }>;

const pick = (stat: { count: number; area?: number } | undefined, metric: StatMetric) =>
  metric === 'area' ? stat?.area ?? 0 : stat?.count ?? 0;

// Rows for one breakdown card, in the chosen metric: the value carried in
// `count`, the same metric's previous-period value for the delta, and the
// column's own total as the denominator for the % share.
export const buildTagRows = (
  tagMap: TagStats | undefined,
  prevMap: TagStats | undefined,
  metric: StatMetric,
): BreakdownRow[] => {
  if (!tagMap) return [];

  const total = Object.values(tagMap).reduce((sum, stat) => sum + pick(stat, metric), 0);
  const rows = Object.entries(tagMap).map(([label, stat]) => ({
    label,
    count: pick(stat, metric),
    previousCount: prevMap?.[label] ? pick(prevMap[label], metric) : undefined,
    total,
  }));

  return orderBy(rows, (row) => row.count, 'desc');
};

export const formatStatValue = (value: number, metric: StatMetric): string =>
  metric === 'area'
    ? `${value.toLocaleString('lt-LT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ha`
    : value.toLocaleString('lt-LT');
