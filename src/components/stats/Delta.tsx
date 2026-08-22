import styled from 'styled-components';

// Signed percentage/absolute change shown next to a stat. Green for positive,
// red for negative, hidden when zero or when there's nothing to compare against.
// A small spinner stands in while the previous-period query is still fetching.
const Delta = ({
  current,
  previous,
  isFetching,
  suffix = '',
}: {
  current?: number;
  previous?: number;
  isFetching?: boolean;
  suffix?: string;
}) => {
  if (isFetching) return <Spinner />;
  if (current === undefined || previous === undefined) return null;

  const diff = current - previous;
  const rounded = diff % 1 !== 0 ? parseFloat(diff.toFixed(2)) : diff;
  if (rounded === 0) return null;

  const positive = rounded > 0;
  return (
    <Value $positive={positive}>
      {positive ? '+' : ''}
      {rounded}
      {suffix}
    </Value>
  );
};

export default Delta;

// The KPI strip shows the change as a percentage of the previous period, not as
// an absolute difference — and it always shows something, "~ 0 %" included.
export const DeltaPercent = ({
  current,
  previous,
  isFetching,
}: {
  current?: number;
  previous?: number;
  isFetching?: boolean;
}) => {
  if (isFetching) return <Spinner />;
  if (current === undefined || previous === undefined) return null;

  const rounded = previous ? Math.round(((current - previous) / previous) * 100) : 0;
  if (rounded === 0) return <Percent $tone="flat">~ 0 %</Percent>;

  return (
    <Percent $tone={rounded > 0 ? 'up' : 'down'}>
      {rounded > 0 ? '+' : ''}
      {rounded} %
    </Percent>
  );
};

const TONES = { up: '#1D7F36', down: '#7F1D1D', flat: '#5C5959' } as const;

const Percent = styled.span<{ $tone: keyof typeof TONES }>`
  font-size: 1.8rem;
  line-height: 2.52rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  white-space: nowrap;
  opacity: 0.7;
  color: ${({ $tone }) => TONES[$tone]};
`;

const Value = styled.span<{ $positive: boolean }>`
  font-size: 1.3rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ $positive }) => ($positive ? '#1F9D57' : '#E5484D')};
`;

const Spinner = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-left-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: stats-delta-spin 0.8s linear infinite;

  @keyframes stats-delta-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
