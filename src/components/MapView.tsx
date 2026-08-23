import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { device } from '../styles';
import { IconName } from '../utils';
import Icon from './Icons';
import Loader from './Loader';

const mapsHost = import.meta.env.VITE_MAPS_HOST || 'https://dev-maps.biip.lt';

// postMessage must name the frame's own origin. '*' delivers the payload to
// whatever document happens to be loaded there, so a redirected or swapped
// iframe would receive the user's filters and drawn geometry.
const mapsOrigin = new URL(mapsHost).origin;

interface MapProps {
  onSave?: (data: any) => void;
  error?: string;
  preview?: boolean;
  filters?: any;
  geom?: any;
  // Non-fullscreen iframe height. Defaults to 60vh (events-feed usage); the
  // dedicated map page passes 100% to fill its container.
  height?: string;
  // The dedicated map page already fills the viewport, so it hides the custom
  // fullscreen toggle (the maps iframe has its own controls).
  hideFullscreen?: boolean;
}

const src = `${mapsHost}/smalsuolis?preview=1`;

const MapView = ({ error, filters, geom, height = '60vh', hideFullscreen }: MapProps) => {
  const iframeRef = useRef<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  const handleLoad = () => {
    setIsIframeLoaded(true);
  };

  // Keyed on the serialized values: both props are rebuilt object literals on
  // every render, so depending on the references themselves would post a
  // message to the iframe on each one.
  const geomKey = JSON.stringify(geom);
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!iframeRef?.current || !isIframeLoaded) return;

    const iframe = iframeRef.current;

    const message: any = {};
    if (geom) message.geom = geom;
    if (filters) message.filters = filters;

    if (Object.keys(message).length > 0) {
      iframe.contentWindow?.postMessage(message, mapsOrigin);
    }
    // geom/filters are read here but intentionally tracked via their keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geomKey, filtersKey, iframeRef, isIframeLoaded]);

  return (
    <Container $showModal={showModal} $error={!!error}>
      <InnerContainer $showModal={showModal}>
        {!hideFullscreen && (
          <StyledButton
            $popup={showModal}
            onClick={(e) => {
              e.preventDefault();

              setShowModal(!showModal);
            }}
          >
            <StyledIconContainer>
              <StyledIcon name={showModal ? IconName.exitFullScreen : IconName.fullscreen} />
            </StyledIconContainer>
          </StyledButton>
        )}
        {!isIframeLoaded && (
          <MapLoader>
            <Loader color="#7c7c7c" />
          </MapLoader>
        )}
        <StyledIframe
          allow="geolocation *"
          ref={iframeRef}
          src={src}
          $width={'100%'}
          $height={showModal ? '100%' : height}
          style={{ border: 0 }}
          allowFullScreen={true}
          aria-hidden="false"
          tabIndex={1}
          onLoad={handleLoad}
        />
      </InnerContainer>
    </Container>
  );
};

const Container = styled.div<{
  $showModal: boolean;
  $error: boolean;
}>`
  width: 100%;
  height: 100%;
  ${({ $showModal }) =>
    $showModal &&
    `
      display: flex;
      position: fixed;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.4);
      justify-content: center;
      align-items: center;
      overflow-y: auto;
      z-index: 1001;
  `}
  ${({ theme, $error }) => $error && `border: 1px solid ${theme.colors.error};`}
`;

const InnerContainer = styled.div<{
  $showModal: boolean;
}>`
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  /* The map's own ground colour, so the wait is a map that has not drawn yet
     rather than a blank page. */
  background: #f7f5f2;
  justify-content: center;
  align-items: center;
  ${({ $showModal }) =>
    $showModal &&
    `
    padding: 16px;
  `}

  @media ${device.mobileL} {
    padding: 0;
  }
`;

// The frame paints nothing until its document is up. It reports that much and
// no more — there is no message for "tiles are drawn" — so the spinner covers
// the fetch and the neutral ground below covers the rest of the wait, instead
// of the area reading as a broken white page.
const MapLoader = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const StyledIframe = styled.iframe<{
  $height: string;
  $width: string;
}>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
`;

const StyledButton = styled.div<{ $popup: boolean }>`
  position: absolute;
  z-index: 10;
  top: ${({ $popup }) => ($popup ? 30 : 15)}px;
  left: ${({ $popup }) => ($popup ? 28 : 11)}px;
  min-width: 28px;
  height: 28px;
  @media ${device.mobileL} {
    top: 10px;
    left: 10px;
  }

  border-color: #e5e7eb;
  background-color: white !important;
  width: 30px;
  height: 30px;
  padding: 0;
  box-shadow: 0px 18px 41px #121a5529;
`;

const StyledIcon = styled(Icon)`
  font-size: 3rem;
  color: #6b7280;
`;

const StyledIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default MapView;
