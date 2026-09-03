import styled from 'styled-components';
import { device, font } from '../../styles';
import { formatRelativeTime } from '../../utils/functions';
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
        <MetaValue>
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

  /* The phone frame stacks the pill under the source instead of squeezing it in
     beside the name, which ellipsised the longer titles. */
  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
  }
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

  @media ${device.mobileL} {
    /* Room for the full name once the pill is out of the row. */
    white-space: normal;

    > div {
      white-space: normal;
      overflow: visible;
    }
  }
`;

// The design sets both lines in the same 14/19.6 #404040 — the staleness colour
// coding is not part of it — and puts the timestamp itself in semibold.
const Meta = styled.div`
  display: flex;
  flex-direction: column;
  ${font('sm')};
  line-height: 1.96rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const MetaValue = styled.span`
  font-weight: 600;
`;

const Pill = styled.div`
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 128px;
  ${font('base', 500)};
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.primary};
  /* Inset ring, not a border: the design's 40px pill is padding + line box. */
  box-shadow: inset 0 0 0 1px rgba(83, 83, 83, 0.12);
  background: ${({ theme }) => theme.colors.white};
  white-space: nowrap;
`;
