import styled from 'styled-components';
import { device } from '../styles';
import Icon from './Icons';
import { Modal } from '@aplinkosministerija/design-system';

// `image` renders an illustration above the title (e.g. the red warning
// triangle on destructive confirmations); when set, the corner close button is
// dropped so the dialog reads as a focused confirmation.
const Popup = ({ title, subTitle, onClose, visible = false, image, children }: any) => {
  return (
    <Modal visible={visible} onClose={onClose}>
      <Container>
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
  margin: 8px auto 0;
`;

const Container = styled.div<{ width?: string; $backgroundImg?: boolean }>`
  background-color: white;
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  margin: auto;
  padding: 16px;
  ${({ $backgroundImg }) =>
    $backgroundImg
      ? ` background-image: url('/empty-bg.svg');
                background-repeat: no-repeat;
                background-position: 50%;
                background-size: cover;`
      : ''}

  @media ${device.desktop} {
    max-width: 500px;
    height: auto;
    overflow: initial;
    min-height: auto;
    padding: 40px;
    flex-basis: auto;
    border-radius: 16px;
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
  margin: 16px 0 8px 0;
  font-size: 2rem;
  font-weight: bold;
`;

const Subtitle = styled.div`
  padding: 4px 0 32px 0;
  text-align: center;
`;

export default Popup;
