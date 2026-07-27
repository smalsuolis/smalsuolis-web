import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AddressSuggestion, IconName, NearEvent, slugs } from '../utils';
import { device, font } from '../styles';
import api from '../utils/api';
import Icon from './Icons';
import { formatDate } from '../utils/functions';

// Radius (metres) used for the "events near this address" lookup. Mirrors the
// visual circle the map draws around the selected point.
const RADIUS = 2000;

// Sleek popup shown when an address is picked on the map: the address label, how
// many events fall within RADIUS of it, and the most recent few (click-through
// to the full event page). Data comes from the /events/near endpoint — no
// dependency on the map iframe.
const NearbyEventsPopup = ({
  suggestion,
  onClose,
}: {
  suggestion: AddressSuggestion;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [lng, lat] = suggestion.geometry.coordinates;

  const { data, isLoading } = useQuery({
    queryKey: ['events-near', lng, lat, RADIUS],
    queryFn: () => api.getEventsNear({ lng, lat, radius: RADIUS, limit: 5 }),
    enabled: lng != null && lat != null,
  });

  return (
    <Card>
      <Header>
        <div>
          <Label>Pasirinktas adresas</Label>
          <Address>{suggestion.label}</Address>
        </div>
        <CloseButton onClick={onClose} aria-label="Uždaryti">
          <Icon name={IconName.close} />
        </CloseButton>
      </Header>

      <CountRow>
        <CountNumber>{isLoading ? '…' : (data?.count ?? 0).toLocaleString('lt-LT')}</CountNumber>
        <CountLabel>įvykių {Math.round(RADIUS / 1000)} km spinduliu</CountLabel>
      </CountRow>

      {!isLoading && !!data?.events.length && (
        <>
          <SectionLabel>Naujausi įvykiai</SectionLabel>
          <List>
            {data.events.map((e: NearEvent) => (
              <Row key={e.id} onClick={() => navigate(slugs.event(String(e.id)))}>
                <RowMain>
                  <RowName>{e.name.split(',')[0].trim()}</RowName>
                  <RowMeta>
                    {e.appName ? `${e.appName} · ` : ''}
                    {formatDate(new Date(e.startAt))}
                  </RowMeta>
                </RowMain>
                <Icon name={IconName.right} />
              </Row>
            ))}
          </List>
        </>
      )}

      {!isLoading && data?.count === 0 && <Empty>Šiuo spinduliu įvykių nerasta</Empty>}
    </Card>
  );
};

export default NearbyEventsPopup;

const Card = styled.div`
  width: min(360px, calc(100vw - 32px));
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Label = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const Address = styled.div`
  ${font('lg', 600)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    font-size: 1.8rem;
  }
`;

const CountRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[300]};
  padding: 12px 0;
`;

const CountNumber = styled.div`
  ${font('2xl', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CountLabel = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const SectionLabel = styled.div`
  ${font('base', 600)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }

  svg {
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.grey[500]};
    flex-shrink: 0;
  }

  &:hover svg {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const RowName = styled.div`
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowMeta = styled.div`
  ${font('base')};
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const Empty = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;
