import { isFuture } from 'date-fns';
import styled from 'styled-components';
import { device, font } from '../styles';
import { Event, getTimeLabel, IconName, subtitle } from '../utils';
import Icon from './Icons';

// The combined `name` is "Type, location, address"; split on the first comma to
// render the type bold and the location muted (matching RecentEvents / design).
const splitName = (name: string): { title: string; location: string } => {
  const idx = name.indexOf(',');
  if (idx === -1) return { title: name, location: '' };
  return { title: name.slice(0, idx).trim(), location: name.slice(idx + 1).trim() };
};

// One row in the events list (redesigned "Naujausi įvykiai"): type + location +
// date on top, data-driven chips below (app name, and "Būsimas" for future
// events), a circular arrow at the right. Clicking opens the event modal.
const EventRow = ({ event, onSelect }: { event: Event; onSelect: (e: Event) => void }) => {
  const { title, location } = splitName(event.name);
  const future = isFuture(new Date(event.startAt));

  return (
    <Row onClick={() => onSelect(event)}>
      <Main>
        <NameLine>
          <NameTitle>{title}</NameTitle>
          {location && <NameLocation>{location}</NameLocation>}
          <MetaDot>·</MetaDot>
          <MetaDate>{getTimeLabel(event)}</MetaDate>
        </NameLine>
        <Tags>
          {event.app?.name && <Tag>{event.app.name}</Tag>}
          {future && <Tag>{subtitle.future}</Tag>}
        </Tags>
      </Main>
      <ArrowCircle>
        <Icon name={IconName.right} />
      </ArrowCircle>
    </Row>
  );
};

export default EventRow;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

const NameLine = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
`;

const NameTitle = styled.span`
  ${font('lg', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const NameLocation = styled.span`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const MetaDot = styled.span`
  color: ${({ theme }) => theme.colors.grey[500]};
`;

const MetaDate = styled.span`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
  white-space: nowrap;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  ${font('base', 500)};
  padding: 8px 16px;
  border-radius: 128px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const ArrowCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.15s ease;

  svg {
    font-size: 1.8rem;
  }

  ${Row}:hover & {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  @media ${device.mobileL} {
    display: none;
  }
`;
