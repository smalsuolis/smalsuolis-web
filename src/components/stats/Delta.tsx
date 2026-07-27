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
