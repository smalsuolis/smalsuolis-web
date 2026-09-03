import styled from 'styled-components';
import { device, font } from '../../styles';
import { SubmitButton } from './authModalStyles';

// Confirmation shown after a token flow (set/reset password) succeeds. Same
// shape as the "Pasitikrinkite el. paštą" frame: a green check over centred
// copy, with the action as a black pill on the right.
const TokenSuccessCard = ({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <Backdrop>
    <Card>
      <Content>
        <CheckCircle aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4 4 10-10"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </CheckCircle>
        <TextGroup>
          <Heading>{title}</Heading>
          <Message>{message}</Message>
        </TextGroup>
      </Content>

      <Footer>
        <SubmitButton onClick={onAction}>{actionLabel}</SubmitButton>
      </Footer>
    </Card>
  </Backdrop>
);

export default TokenSuccessCard;

const Backdrop = styled.div`
  /* The layout centres its children, which makes them shrink to fit. */
  width: 100%;
  min-height: calc(100vh - 72px);
  min-height: calc(100dvh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media ${device.mobileL} {
    padding: 16px;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 499px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 48px;

  @media ${device.mobileL} {
    padding: 24px 16px;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
`;

const CheckCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1fc84c;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  align-self: stretch;
`;

const Heading = styled.h2`
  ${font('2xl')};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Message = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Right-aligned on the 499 frame, full width on the 361 one.
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;

  @media ${device.mobileL} {
    div:has(> button) {
      width: 100%;
    }
  }
`;
