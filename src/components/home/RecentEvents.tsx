import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { Event, slugs } from '../../utils';
import api from '../../utils/api';
import EventModal from '../EventModal';
import EventRow from '../EventRow';

// "Naujausi įvykiai" — a flat list of the most recent events, rendered with the
// same row the events feed uses. Only the spacing between rows differs.
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
          <SeeAllArrow src="/icons/arrow_right.svg" alt="" />
        </SeeAll>
      </Header>

      <List>
        {events.map((event: Event) => (
          <EventRow key={event.id} event={event} onSelect={setSelectedEvent} />
        ))}
      </List>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </Wrap>
  );
};

export default RecentEvents;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 36px;

  @media ${device.mobileL} {
    gap: 24px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  @media ${device.mobileL} {
    ${font('2xl', 400)};
  }
`;

// The mobile frame drops this link — the phone list is the whole section.
const SeeAll = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  ${font('xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  background: transparent;
  transition: color 0.15s ease;

  /* The lighter grey the black buttons take under the pointer — the same
     #333333 token, so one hover answer across the page. The arrow is a black
     SVG in an img element, which the CSS colour cannot reach; at 0.8 opacity it
     lands on that same value over white. */
  &:hover {
    color: ${({ theme }) => theme.colors.grey[700]};
  }

  &:hover img {
    opacity: 0.8;
  }

  @media ${device.mobileL} {
    display: none;
  }
`;

const SeeAllArrow = styled.img`
  display: block;
  width: 24px;
  height: 24px;
  transition: opacity 0.15s ease;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 36px;

  @media ${device.mobileL} {
    gap: 24px;
  }
`;
