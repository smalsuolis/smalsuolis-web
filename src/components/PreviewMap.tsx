import { useRef, useState } from 'react';
import styled from 'styled-components';
import { device } from '../styles';
import { FieldWrapper, FeatureCollection } from '@aplinkosministerija/design-system';
import Icon from './Icons';
import { IconName } from '../utils';

const mapsHost = import.meta.env.VITE_MAPS_HOST;

interface MapProps {
  height?: string;
  onSave?: (data: any) => void;
  error?: string;
  value?: FeatureCollection;
  label?: string;
  showError?: boolean;
  preview?: boolean;
}

const PreviewMap = ({ height = '230px', error, value, showError = true, label }: MapProps) => {
  const iframeRef = useRef<any>(null);
  const [showModal, setShowModal] = useState(false);

  const src = `${mapsHost}/edit?preview=true`;

  const handleLoadMap = () => {
    if (!value) return;
    iframeRef?.current?.contentWindow?.postMessage({ geom: value }, '*');
  };

  return (
    <FieldWrapper showError={showError} error={error} label={label}>
      <Container $showModal={showModal} $error={!!error}>
        <InnerContainer $showModal={showModal}>
          <StyledButton
            type="button"
            aria-label={showModal ? 'Sumažinti žemėlapį' : 'Padidinti žemėlapį'}
            title={showModal ? 'Sumažinti žemėlapį' : 'Padidinti žemėlapį'}
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
          <StyledIframe
            allow="geolocation *"
            ref={iframeRef}
            src={src}
            $width={'100%'}
            $height={showModal ? '100%' : `${height || '230px'}`}
            style={{ border: 0 }}
            allowFullScreen={true}
            onLoad={handleLoadMap}
            aria-hidden="false"
            tabIndex={1}
          />
        </InnerContainer>
      </Container>
    </FieldWrapper>
  );
};

const Container = styled.div<{
  $showModal: boolean;
  $error: boolean;
}>`
  width: 100%;
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

const StyledIframe = styled.iframe<{
  $height: string;
  $width: string;
}>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
`;

// Top right, with the frame's own view controls — locate, basemap, zoom — and
// not in the top-left row, which holds its content actions (layers, share).
// Expanding is a view control, and that corner is where the eye looks for it.
// The frame anchors that column to the bottom (in a 350px map its first button
// starts ~244px down), so the corner is free at every height we render.
//
// It used to sit at 11px, square on top of the layers button, which is what made
// it read as a broken control rather than a button.
const StyledButton = styled.button<{ $popup: boolean }>`
  position: absolute;
  z-index: 10;
  top: ${({ $popup }) => ($popup ? 25 : 9)}px;
  left: ${({ $popup }) => ($popup ? 121 : 105)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
`;

// The frame inks its own glyphs at #4C545F; #6B7280 beside them read as a
// control that had been disabled.
const StyledIcon = styled(Icon)`
  font-size: 2rem;
  color: #4c545f;
`;

const StyledIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default PreviewMap;
