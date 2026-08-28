import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { Event, getTimeLabel, IconName } from '../utils';
import { device, font } from '../styles';
import Icon from './Icons';
import PreviewMap from './PreviewMap';

// The location line shown under the title = everything after the first comma of
// the combined `name` ("Type, location, address"). Same split RecentEvents uses.
const locationOf = (name: string): string => {
  const idx = name.indexOf(',');
  return idx === -1 ? '' : name.slice(idx + 1).trim();
};

// Event detail modal (Figma 2147226065). Opened from the events list; shows the
// title + address/date subtitle, an interactive map preview, the event's detail
// rows (rendered from the markdown `body`), and a link out to the source site.
const EventModal = ({ event, onClose }: { event: Event; onClose: () => void }) => {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const location = locationOf(event.name);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <Header>
          <HeaderText>
            <Title>{event.name.split(',')[0].trim()}</Title>
            {location && <Subtitle>{location}</Subtitle>}
            <Subtitle>{getTimeLabel(event)}</Subtitle>
          </HeaderText>
          <CloseButton onClick={onClose} aria-label="Uždaryti">
            <Icon name={IconName.close} />
          </CloseButton>
        </Header>

        <MapWrap>
          <PreviewMap value={event.geom} height={'239px'} showError={false} />
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
      </Modal>
    </Overlay>
  );
};

export default EventModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(11, 11, 11, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media ${device.mobileL} {
    padding: 16px;
  }
`;

const Modal = styled.div`
  position: relative;
  width: 100%;
  max-width: 673px;
  max-height: 92vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${device.mobileL} {
    max-width: 100%;
    max-height: 88vh;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

// The frame stacks the title, the location and the date tight against each
// other — 31 + 24 + 24 = the 79px header block it draws.
const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

// Some events (e.g. land-planning ones) have very long cadastral-number names.
// The modal is a quick look, so clamp the title to two lines with an ellipsis;
// the full title is shown on the standalone event page (opened via Nuoroda).
const Title = styled.h2`
  ${font('2xl')};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// Flattened #404040 at the 64% the design applies to both meta lines.
const Subtitle = styled.div`
  ${font('base')};
  color: #858585;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CloseButton = styled.button`
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    font-size: 2rem;
  }
`;

// The frame draws the map flush — no radius — at 239 tall (120 on a phone).
const MapWrap = styled.div`
  width: 100%;
  overflow: hidden;

  iframe {
    display: block;
  }

  @media ${device.mobileL} {
    iframe,
    > div {
      height: 120px !important;
    }
  }
`;

// Event detail rows come from the markdown `body` (**Label**: value pairs). Each
// paragraph is one row; the bold label sits inline with its value.
const Body = styled.div`
  display: flex;
  flex-direction: column;

  p {
    ${font('base')};
    margin: 0;
    padding: 8px 0;
    color: ${({ theme }) => theme.colors.text.primary};
    /* Values arrive from the integrations and some have no spaces to wrap at —
       a source URL, a long list of cadastral numbers. Without this the row
       cannot break and widens the modal until it scrolls sideways. anywhere
       rather than break-all, so ordinary text still breaks between words. */
    overflow-wrap: anywhere;
  }

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 700;
  }
`;

// Design: a left-aligned 40px black pill, 24px below the content column (which
// runs at 16 — hence the extra 8 here).
const VisitButton = styled.button`
  align-self: flex-start;
  margin-top: 8px;
  height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};
  cursor: pointer;
  text-align: center;

  &:hover {
    opacity: 0.9;
  }

  @media ${device.mobileL} {
    align-self: stretch;
  }
`;
