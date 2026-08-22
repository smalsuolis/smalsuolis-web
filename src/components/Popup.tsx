import styled from 'styled-components';
import { device, font } from '../styles';
import Icon from './Icons';
import { Modal } from '@aplinkosministerija/design-system';

// `image` renders an illustration above the title (e.g. the red warning
// triangle on destructive confirmations); when set, the corner close button is
// dropped so the dialog reads as a focused confirmation.
const Popup = ({ title, subTitle, onClose, visible = false, image, children }: any) => {
  return (
    <Modal visible={visible} onClose={onClose}>
      <Container data-modal-card>
        {image ? (
          <Illustration src={image} alt="" aria-hidden="true" />
        ) : (
          <IconContainer onClick={onClose}>
            <StyledIcon name="close" />
          </IconContainer>
        )}
        <Title>{title}</Title>
        {subTitle && <Subtitle>{subTitle}</Subtitle>}
        {children}
      </Container>
    </Modal>
  );
};

const StyledIcon = styled(Icon)`
  cursor: pointer;
  font-size: 2.4rem;
`;

const Illustration = styled.img`
  display: block;
  width: 48px;
  height: 48px;
  margin: 0 auto;
`;

// Design: a 499/361 card with 36px above its content and 24 around the rest —
// it stays a card on phones rather than filling the screen.
const Container = styled.div<{ width?: string; $backgroundImg?: boolean }>`
  background-color: white;
  position: relative;
  width: 100%;
  max-width: 361px;
  margin: auto;
  padding: 36px 16px 24px;
  border-radius: 8px;
  ${({ $backgroundImg }) =>
    $backgroundImg
      ? ` background-image: url('/empty-bg.svg');
                background-repeat: no-repeat;
                background-position: 50%;
                background-size: cover;`
      : ''}

  @media ${device.desktop} {
    max-width: 499px;
    padding: 36px 24px 24px;
  }
`;

const IconContainer = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  top: 20px;
  right: 20px;
  opacity: 0.8;
  transition: all 200ms;
  font-size: 24px;
  font-weight: bold;
  text-decoration: none;
`;

const Title = styled.div`
  text-align: center;
  margin: 24px 0 4px;
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.div`
  text-align: center;
  margin-bottom: 48px;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};

  @media ${device.mobileL} {
    margin-bottom: 24px;
  }
`;

export default Popup;
