import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { Event, getTimeLabel, IconName, slugs } from '../utils';
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
  const [copied, setCopied] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Copy the shareable permalink to the standalone event page. Quick lookups
  // happen in this modal, but the link people share is the full page.
  const copyPermalink = async () => {
    if (!event.id) return;
    const url = `${window.location.origin}${slugs.event(String(event.id))}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — no-op.
    }
  };

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
          <HeaderActions>
            {event.id && (
              <CopyLinkButton onClick={copyPermalink} aria-label="Kopijuoti nuorodą">
                <Icon name={IconName.openInNew} />
                <CopyLabel>{copied ? 'Nukopijuota' : 'Nuoroda'}</CopyLabel>
              </CopyLinkButton>
            )}
            <CloseButton onClick={onClose} aria-label="Uždaryti">
              <Icon name={IconName.close} />
            </CloseButton>
          </HeaderActions>
        </Header>

        <MapWrap>
          <PreviewMap value={event.geom} height={'220px'} showError={false} />
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
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media ${device.mobileL} {
    padding: 0;
    align-items: flex-end;
  }
`;

const Modal = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 92vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${device.mobileL} {
    max-width: 100%;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

// Some events (e.g. land-planning ones) have very long cadastral-number names.
// The modal is a quick look, so clamp the title to two lines with an ellipsis;
// the full title is shown on the standalone event page (opened via Nuoroda).
const Title = styled.h2`
  ${font('xl', 600)};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Subtitle = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const CopyLinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: 100px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.grey[600]};
  ${font('base', 500)};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  svg {
    font-size: 1.6rem;
  }
`;

const CopyLabel = styled.span`
  @media ${device.mobileL} {
    display: none;
  }
`;

const CloseButton = styled.button`
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

const MapWrap = styled.div`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;

  iframe {
    border-radius: 12px;
    display: block;
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
    color: ${({ theme }) => theme.colors.grey[700]};
  }

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
  }
`;

const VisitButton = styled.button`
  align-self: stretch;
  margin-top: 4px;
  padding: 14px 24px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base', 600)};
  cursor: pointer;
  text-align: center;

  &:hover {
    opacity: 0.9;
  }
`;
