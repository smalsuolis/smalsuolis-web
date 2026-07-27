import styled from 'styled-components';
import Icon from '../Icons';
import { IconName } from '../../utils';
import { formatRelativeTime, getUpdateStatusColor } from '../../utils/functions';

// One "Duomenų šaltiniai" card: an icon + source name, the last-update time
// (relative, colored by staleness) with the absolute timestamp beneath, and — if
// the latest sync brought new events — a "Gauti N nauji įvykiai" pill.
const SourceCard = ({
  icon,
  title,
  lastUpdate,
  lastUpdateCount,
}: {
  icon: IconName;
  title: string;
  lastUpdate: string | null;
  lastUpdateCount: number;
}) => (
  <Card>
    <Left>
      <Header>
        <IconChip>
          <ChipIcon name={icon} />
        </IconChip>
        <Title>{title}</Title>
      </Header>
      <Meta>
        <MetaLabel>Paskutinis atnaujinimas:</MetaLabel>
        <MetaValue $color={getUpdateStatusColor(lastUpdate)}>
          {formatRelativeTime(lastUpdate)}
          {lastUpdate ? ` ${new Date(lastUpdate).toLocaleString('lt-LT')}` : ''}
        </MetaValue>
      </Meta>
    </Left>
    {lastUpdateCount > 0 && (
      <Pill>Gauti {lastUpdateCount.toLocaleString('lt-LT')} nauji įvykiai</Pill>
    )}
  </Card>
);

export default SourceCard;

const Card = styled.div`
  /* Shrink inside the grid track rather than widening the page. */
  min-width: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
  gap: 10px;
`;

const IconChip = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  /* Some icons (forest, fishThin) hardcode width/height on their <svg> and
     ignore className, so constrain any child svg to the chip's icon size. */
  & > svg {
    width: 18px;
    height: 18px;
  }
`;

const ChipIcon = styled(Icon)`
  width: 18px;
  height: 18px;
  color: ${({ theme }) => theme.colors.tertiary};
`;

const Title = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.primary};
  /* Long source names ellipsize instead of widening the card. */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.div`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const MetaValue = styled.div<{ $color?: string }>`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${({ $color, theme }) => $color || theme.colors.text?.primary};
`;

const Pill = styled.div`
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.background};
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.primary};
  white-space: nowrap;
`;
