import { isFuture } from 'date-fns';
import styled from 'styled-components';
import { device, font, rowHoverTint } from '../styles';
import { Event, getTimeLabel, subtitle } from '../utils';

// The API returns a single combined `name` ("Type, location, address"); split on
// the first comma so the type reads as the title and the location as its meta.
const splitName = (name: string): { title: string; location: string } => {
  const idx = name.indexOf(',');
  if (idx === -1) return { title: name, location: '' };
  return { title: name.slice(0, idx).trim(), location: name.slice(idx + 1).trim() };
};

// The design's "Project Info" row, shared by the events feed and the homepage's
// "Naujausi įvykiai": title, location + date, data-driven chips, arrow. Only the
// spacing between rows differs between the two lists, and that lives in the list.
const EventRow = ({ event, onSelect }: { event: Event; onSelect: (e: Event) => void }) => {
  const { title, location } = splitName(event.name);
  const future = isFuture(new Date(event.startAt));

  return (
    <Row onClick={() => onSelect(event)}>
      <Main>
        <NameTitle>{title}</NameTitle>
        <MetaLine>
          {location && <NameLocation>{location}</NameLocation>}
          {location && <MetaDot>·</MetaDot>}
          <MetaDate>{getTimeLabel(event)}</MetaDate>
        </MetaLine>
        <Tags>
          {event.app?.name && <Tag>{event.app.name}</Tag>}
          {future && <Tag>{subtitle.future}</Tag>}
        </Tags>
      </Main>
      <Arrow src="/icons/arrow_right.svg" alt="" />
    </Row>
  );
};

export default EventRow;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 0 0 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[400]};
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  ${rowHoverTint('16px')};
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;

  @media ${device.mobileL} {
    width: 100%;
  }
`;

// Design (Project Info): the title owns the first line at full width; location
// and date sit on a second line separated by a dot. Keeping all three on one
// line made long land-planning titles wrap unpredictably.
const MetaLine = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 16px;
`;

const NameTitle = styled.span`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

// Flattened #333333 at the 64% the design applies to both meta runs.
const NameLocation = styled.span`
  ${font('xl')};
  color: #7c7c7c;
`;

const MetaDot = styled.span`
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const MetaDate = styled.span`
  ${font('xl')};
  color: #7c7c7c;
  white-space: nowrap;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const Tag = styled.span`
  ${font('sm', 500)};
  padding: 12px 20px;
  border-radius: 128px;
  /* Inset ring, not a border: the design's 45px pill is padding + line box, and
     a real border would push it to 47. */
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.grey[300]};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

// The phone frame drops the arrow — the whole row is the tap target there.
const Arrow = styled.img`
  display: block;
  flex-shrink: 0;
  width: 24px;
  height: 24px;

  @media ${device.mobileL} {
    display: none;
  }
`;

export const EventRowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${device.mobileL} {
    gap: 24px;
  }
`;
