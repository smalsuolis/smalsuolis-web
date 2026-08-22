import styled from 'styled-components';
import { font } from '../../styles';
import { formatRelativeTime, getUpdateStatusColor } from '../../utils/functions';
import { Card, CardHeading, CircleIcon, IconCircle } from './cardStyles';

// One "Duomenų šaltiniai" card: an icon + source name, the last-update time
// (relative, colored by staleness) with the absolute timestamp beneath, and — if
// the latest sync brought new events — a "Gauti N nauji įvykiai" pill.
const SourceCard = ({
  icon,
  iconBg,
  title,
  lastUpdate,
  lastUpdateCount,
}: {
  icon: string;
  iconBg: string;
  title: string;
  lastUpdate: string | null;
  lastUpdateCount: number;
}) => (
  <Wrap>
    <Left>
      <Header>
        <IconCircle $bg={iconBg}>
          <CircleIcon src={icon} alt="" />
        </IconCircle>
        <CardHeading>{title}</CardHeading>
      </Header>
      <Meta>
        <span>Paskutinis atnaujinimas:</span>
        <MetaValue $color={getUpdateStatusColor(lastUpdate)}>
          {formatRelativeTime(lastUpdate)}
          {lastUpdate ? ` ${new Date(lastUpdate).toLocaleString('lt-LT')}` : ''}
        </MetaValue>
      </Meta>
    </Left>
    {lastUpdateCount > 0 && (
      <Pill>Gauti {lastUpdateCount.toLocaleString('lt-LT')} nauji įvykiai</Pill>
    )}
  </Wrap>
);

export default SourceCard;

const Wrap = styled(Card)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  ${font('sm')};
  line-height: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const MetaValue = styled.span<{ $color?: string }>`
  color: ${({ $color, theme }) => $color || theme.colors.text.primary};
`;

const Pill = styled.div`
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 128px;
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
  /* Inset ring, not a border: the design's 40px pill is padding + line box. */
  box-shadow: inset 0 0 0 1px rgba(83, 83, 83, 0.12);
  background: ${({ theme }) => theme.colors.white};
  white-space: nowrap;
`;
