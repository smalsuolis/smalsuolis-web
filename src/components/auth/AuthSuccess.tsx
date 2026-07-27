import { Button } from '@aplinkosministerija/design-system';
import styled from 'styled-components';
import { buttonsTitles } from '../../utils/texts';
import { font } from '../../styles';
import AuthModalShell from './AuthModalShell';

// Shared confirmation screen for register / forgot-password (Figma
// "Pasitikrinkite el. paštą"): a green check, a heading, the address the
// instructions were sent to, and an "Uždaryti" button.
const AuthSuccess = ({
  onClose,
  email,
  message,
}: {
  onClose: () => void;
  email: string;
  // Trailing copy after the bolded email, e.g. "išsiuntėme registracijos
  // instrukciją" / "išsiuntėme prisijungimo instrukciją".
  message: string;
}) => (
  <AuthModalShell onClose={onClose}>
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
      <Heading>Pasitikrinkite el. paštą</Heading>
      <Text>
        El. paštu <Bold>{email}</Bold> {message}
      </Text>
      <CloseAction onClick={onClose}>{buttonsTitles.close}</CloseAction>
    </Content>
  </AuthModalShell>
);

export default AuthSuccess;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  padding: 0 8px 8px;
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

const Heading = styled.h2`
  ${font('2xl', 600)};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Text = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[700]};
  max-width: 320px;
`;

const Bold = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseAction = styled(Button)`
  margin-top: 8px;
  align-self: stretch;
`;
