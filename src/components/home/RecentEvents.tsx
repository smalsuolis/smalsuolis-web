import { useQuery } from '@tanstack/react-query';
import { isFuture } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { Event, getTimeLabel, IconName, slugs, subtitle } from '../../utils';
import api from '../../utils/api';
import Icon from '../Icons';
import EventModal from '../EventModal';

// "Naujausi įvykiai" — a flat list of the most recent events. Reuses the same
// events endpoint, Event type, and getTimeLabel helper the feed/cards use.
// The API returns a single combined `name` ("Type, location, address"); we
// split on the first comma to render the type bold and the location muted,
// matching the design's hierarchy.
const splitName = (name: string): { title: string; location: string } => {
  const idx = name.indexOf(',');
  if (idx === -1) return { title: name, location: '' };
  return { title: name.slice(0, idx).trim(), location: name.slice(idx + 1).trim() };
};

const RecentEvents = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { data } = useQuery({
    queryKey: ['home-recent-events'],
    queryFn: () => api.getEvents({ page: 1, query: undefined }),
    refetchOnWindowFocus: false,
  });

  const events = (data?.rows ?? []).slice(0, 8);

  return (
    <Wrap>
      <Header>
        <Title>Naujausi įvykiai</Title>
        <SeeAll onClick={() => navigate(slugs.events)}>
          Rodyti visus įvykius
          <Icon name={IconName.right} />
        </SeeAll>
      </Header>

      <List>
        {events.map((event: Event) => {
          const { title, location } = splitName(event.name);
          const future = isFuture(new Date(event.startAt));
          return (
            <RowLink key={event.id} onClick={() => setSelectedEvent(event)}>
              <RowMain>
                <NameTitle>{title}</NameTitle>
                <MetaLine>
                  {location && <NameLocation>{location}</NameLocation>}
                  {location && <MetaDot>·</MetaDot>}
                  <MetaDate>{getTimeLabel(event)}</MetaDate>
                </MetaLine>
                <Tags>
                  <Tag>{event.app?.name || '—'}</Tag>
                  {future && <Tag>{subtitle.future}</Tag>}
                </Tags>
              </RowMain>
              <ArrowCircle>
                <Icon name={IconName.right} />
              </ArrowCircle>
            </RowLink>
          );
        })}
      </List>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </Wrap>
  );
};

export default RecentEvents;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

// DS "Naujausi įvykiai" heading: Medium 30px, tight tracking. Node 116:1910.
const Title = styled.h2`
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

// DS "Rodyti visus įvykius" link: Regular 20px black. Node 116:1912.
const SeeAll = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${font('xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  background: transparent;

  svg {
    font-size: 1.8rem;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const RowLink = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 0 0 32px;
  /* Rules sit between rows, so the last one carries none. */
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[400]};
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
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

const NameLocation = styled.span`
  ${font('xl')};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const MetaDot = styled.span`
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const MetaDate = styled.span`
  ${font('xl')};
  color: ${({ theme }) => theme.colors.grey[700]};
  white-space: nowrap;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

// DS event tag ("Category" chip): white bg, 1px grey-300 border, radius 128px,
// padding 12px 20px, Medium 16px text in grey-700 (#333). Figma node 116:1926.
const Tag = styled.span`
  ${font('base', 500)};
  padding: 12px 20px;
  border-radius: 128px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const ArrowCircle = styled.div`
  /* Design (Project Info): a plain 24px arrow at the row's right edge, not a
     bordered circle. */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: transform 0.15s ease;

  svg {
    font-size: 2rem;
  }
`;
