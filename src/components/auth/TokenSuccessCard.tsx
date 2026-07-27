import { Button } from '@aplinkosministerija/design-system';
import styled from 'styled-components';
import { device, font } from '../../styles';

// Confirmation shown after a token flow (set/reset password) succeeds: a green
// check, a message, and a button through to login. Matches the auth card look.
const TokenSuccessCard = ({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <Backdrop>
    <Card>
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
      <Message>{message}</Message>
      <Action onClick={onAction}>{actionLabel}</Action>
    </Card>
  </Backdrop>
);

export default TokenSuccessCard;

const Backdrop = styled.div`
  min-height: calc(100vh - 72px);
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
  max-width: 480px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
`;

const CheckCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[700]};
  max-width: 340px;
`;

const Action = styled(Button)`
  margin-top: 8px;
  align-self: stretch;
`;
