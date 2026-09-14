import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import LoaderComponent from '../components/LoaderComponent';
import PreviewMap from '../components/PreviewMap';
import Icon from '../components/Icons';
import api from '../utils/api';
import { getTimeLabel, IconName, slugs } from '../utils';
import { device, font } from '../styles';

// The combined `name` is "Type, location, address". On the full page we show the
// whole thing as the title and pull the location tail into a subtitle line.
const locationOf = (name: string): string => {
  const idx = name.indexOf(',');
  return idx === -1 ? '' : name.slice(idx + 1).trim();
};

// Standalone event page — the canonical, shareable view (permalink target). Shows
// everything at full size: the complete title (which can be long for land-planning
// events), a large map, and all detail rows. Quick lookups use the modal instead.
const EventPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.getEvent({ id }),
  });

  if (isLoading) return <LoaderComponent />;
  if (!event) return <></>;

  const location = locationOf(event.name);

  return (
    <Page>
      <BackLink onClick={() => navigate(slugs.events)}>
        <Icon name={IconName.back} />
        Visi įvykiai
      </BackLink>

      <Title>{event.name}</Title>
      <MetaRow>
        {event.app?.name && <Chip>{event.app.name}</Chip>}
        {location && <MetaText>{location}</MetaText>}
        <MetaDot>·</MetaDot>
        <MetaText>{getTimeLabel(event)}</MetaText>
      </MetaRow>

      <MapWrap>
        <PreviewMap value={event.geom} height={'420px'} showError={false} />
      </MapWrap>

      {event.body && (
        <Body>
          <ReactMarkdown>{event.body}</ReactMarkdown>
        </Body>
      )}

      {event.url && (
        <VisitButton onClick={() => window.open(event.url, '_blank', 'noopener')}>
          Aplankykite svetainę
        </VisitButton>
      )}
    </Page>
  );
};

export default EventPage;

const Page = styled.div`
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0 48px;
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.grey[600]};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  svg {
    font-size: 1.8rem;
  }
`;

const Title = styled.h1`
  ${font('3xl')};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const Chip = styled.span`
  ${font('base', 500)};
  padding: 8px 16px;
  border-radius: 128px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const MetaText = styled.span`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const MetaDot = styled.span`
  color: ${({ theme }) => theme.colors.grey[500]};
`;

const MapWrap = styled.div`
  width: 100%;
  border-radius: 16px;
  overflow: hidden;

  iframe {
    border-radius: 16px;
    display: block;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 16px;
  padding: 8px 24px;

  p {
    ${font('lg')};
    margin: 0;
    padding: 16px 0;
    color: ${({ theme }) => theme.colors.grey[700]};

    & + p {
      border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
    }
  }

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
  }
`;

const VisitButton = styled.button`
  align-self: flex-start;
  padding: 16px 32px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base', 600)};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.grey[700]};
  }

  @media ${device.mobileL} {
    align-self: stretch;
    text-align: center;
  }
`;
