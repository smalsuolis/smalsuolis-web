import styled from 'styled-components';
import { buttonsTitles } from '../../utils/texts';
import { device, font } from '../../styles';
import AuthModalShell from './AuthModalShell';
import { SubmitButton } from './authModalStyles';

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
      <TextGroup>
        <Heading>Pasitikrinkite el. paštą</Heading>
        <Text>
          El. paštu <Bold>{email}</Bold> {message}
        </Text>
      </TextGroup>
    </Content>

    {/* The design leaves 48px above this row; the shell already contributes 24. */}
    <Footer>
      <SubmitButton onClick={onClose}>{buttonsTitles.close}</SubmitButton>
    </Footer>
  </AuthModalShell>
);

export default AuthSuccess;

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

const Text = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Bold = styled.span`
  font-weight: 700;
`;

// Right-aligned on the 499 frame, full width on the 361 one.
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;

  @media ${device.mobileL} {
    div:has(> button) {
      width: 100%;
    }
  }
`;
