import { useQuery } from '@tanstack/react-query';
import { isFuture } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { Event, getTimeLabel, IconName, slugs, subtitle } from '../../utils';
import api from '../../utils/api';
import Icon from '../Icons';

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
            <RowLink key={event.id} onClick={() => navigate(slugs.event(String(event.id)))}>
              <RowMain>
                <NameLine>
                  <NameTitle>{title}</NameTitle>
                  {location && <NameLocation>{location}</NameLocation>}
                  <MetaDot>·</MetaDot>
                  <MetaDate>{getTimeLabel(event)}</MetaDate>
                </NameLine>
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

const Title = styled.h2`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const SeeAll = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${font('base', 500)};
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
`;

const RowLink = styled.div`
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

const RowMain = styled.div`
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
  font-size: 1.3rem;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
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

  ${RowLink}:hover & {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  @media ${device.mobileL} {
    display: none;
  }
`;
