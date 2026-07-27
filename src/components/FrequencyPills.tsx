import styled from 'styled-components';
import { Frequency, subscriptionFrequencyTitles } from '../utils';

// Pill-style frequency picker: how often the newsletter email is sent. DAY is
// deliberately absent — it stays in the enum so existing daily subscribers keep
// working, but new/edited subscriptions choose from the four designed options.
const options = [Frequency.WEEK, Frequency.MONTH, Frequency.YEAR, Frequency.ALL];

const FrequencyPills = ({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (value: Frequency) => void;
}) => (
  <Container role="radiogroup">
    {options.map((option) => (
      <Pill
        key={option}
        type="button"
        role="radio"
        aria-checked={value === option}
        $selected={value === option}
        onClick={() => onChange(option)}
      >
        {subscriptionFrequencyTitles[option]}
      </Pill>
    ))}
  </Container>
);

export default FrequencyPills;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Pill = styled.button<{ $selected: boolean }>`
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;
  background: none;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ $selected }) => ($selected ? '#1a1a1a' : '#d4d5de')};
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-shadow: ${({ $selected }) => ($selected ? 'inset 0 0 0 1px #1a1a1a' : 'none')};
`;
