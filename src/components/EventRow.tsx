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
        <NameLine>
          <NameTitle>{title}</NameTitle>
          {location && <NameLocation>{location}</NameLocation>}
          {location && <MetaDot aria-hidden="true" />}
          <MetaDate>{getTimeLabel(event)}</MetaDate>
        </NameLine>
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

  @media ${device.mobileL} {
    border-bottom-color: ${({ theme }) => theme.colors.grey[300]};
  }

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

// Design (Project Info): title, location, dot and date share one line. Real
// land-planning titles are far longer than the frame's sample, so the line
// wraps rather than overflowing — at the 8px the frame uses between its rows.
const NameLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;

  /* The phone frame stacks the three, drops the dot and drops a size. */
  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const NameTitle = styled.span`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.grey[700]};

  @media ${device.mobileL} {
    font-size: 1.8rem;
    line-height: 2.3rem;
    font-weight: 600;
  }
`;

// Flattened #333333 at the 64% the design applies to both meta runs.
const NameLocation = styled.span`
  ${font('xl')};
  color: #7c7c7c;

  @media ${device.mobileL} {
    ${font('base')};
  }
`;

// A 5px dot, not a punctuation glyph — the frame draws an ellipse.
const MetaDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.grey[400]};
  flex-shrink: 0;

  @media ${device.mobileL} {
    display: none;
  }
`;

const MetaDate = styled.span`
  ${font('xl')};
  color: #7c7c7c;
  white-space: nowrap;

  @media ${device.mobileL} {
    ${font('base')};
  }
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
