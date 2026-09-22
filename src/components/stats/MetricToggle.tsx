import styled from 'styled-components';
import type { StatMetric } from '../../utils/statsRows';

const OPTIONS: Array<{ value: StatMetric; label: string }> = [
  { value: 'count', label: 'Leidimų skaičius' },
  { value: 'area', label: 'Kertamas plotas' },
];

// Two pills, one of them filled — the switch the March stats page had, redrawn
// against the card's own outline so it sits inside a BreakdownCard. Filled
// black rather than the theme's #73DC8C primary: white copy needs the contrast.
const MetricToggle = ({
  value,
  onChange,
}: {
  value: StatMetric;
  onChange: (metric: StatMetric) => void;
}) => (
  <Track role="group" aria-label="Rodiklis">
    {OPTIONS.map((option) => (
      <Pill
        key={option.value}
        type="button"
        $isActive={value === option.value}
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </Pill>
    ))}
  </Track>
);

export default MetricToggle;

const Track = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  padding: 2px;
  gap: 2px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 100px;
  align-self: flex-start;
  max-width: 100%;
`;

const Pill = styled.button<{ $isActive: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  font-size: 1.3rem;
  line-height: 1.8rem;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  background-color: ${({ $isActive, theme }) => ($isActive ? theme.colors.black : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.white : theme.colors.text.primary)};

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.black : theme.colors.grey[300]};
  }
`;
