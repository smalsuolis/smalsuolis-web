import { useContext } from 'react';
import styled from 'styled-components';
import { device, font } from '../../styles';
import Button from '../ui/Button';
import { useAuthModal } from '../auth/AuthModalContext';
import { UserContext, UserContextType } from '../UserProvider';

// Green CTA at the bottom of the stats page, on the exported Figma artwork
// (public/tapk_smalsiu.png). Drives registration.
const SubscribeBanner = () => {
  const { open } = useAuthModal();
  const { loggedIn } = useContext<UserContextType>(UserContext);

  // Same reasoning as the homepage cards: a subscriber does not need the pitch —
  // and the same rhythm stays behind, or the sources section ends flush against
  // the footer. The banner carried 124 above it.
  if (loggedIn) return <Spacer />;

  return (
    <Banner>
      <Content>
        <Title>Tapk Smalsuolio prenumeratoriumi</Title>
        <Copy>
          Užsiregistruok. Pažymėk tave dominančias įvykių kategorijas. Gauk elektroniniu paštu
          naujausią informaciją apie tai, kas įvyko
        </Copy>
        <ButtonWrap>
          <Button variant="dark" onClick={() => open('register')}>
            Tapk Smalsiu
          </Button>
        </ButtonWrap>
      </Content>
    </Banner>
  );
};

export default SubscribeBanner;

// Flattened PNG export (4008x1137, ~3.5:1) — the white line work is already
// baked in, so no blend-mode reinterpretation like the SVG had. Stretched to
// the banner box so the whole sweep stays visible; flat base green backs it.
const Spacer = styled.div`
  height: 124px;

  @media ${device.mobileL} {
    height: 42px;
  }
`;

const Banner = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 82px 56px 82px 83px;
  /* Design: 124px clear above, and 124 below — the footer already contributes
     its own 42px lead-in, so the rest lives here. */
  margin-top: 124px;
  margin-bottom: 82px;
  background:
    url('/tapk_smalsiu.png') center / 100% 100% no-repeat,
    #7eec9b;

  /* The phone frame runs the band edge to edge with square corners, so it
     escapes the page gutter. */
  @media (max-width: 868px) {
    margin: 42px -16px 0;
    padding: 46px 36px;
    border-radius: 0;
  }
`;

// The frame keeps 20px between the heading and the copy and 40 before the
// button, so the button carries the remaining 20.
const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
  max-width: 582px;
`;

const Title = styled.div`
  font-size: 3.2rem;
  line-height: 3.8rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text?.primary};
`;

const Copy = styled.p`
  ${font('xl')};
  color: ${({ theme }) => theme.colors.text?.primary};
  margin: 0;
`;

const ButtonWrap = styled.div`
  margin-top: 20px;

  button {
    width: 180px;
    height: 40px;
    min-height: 40px;
    padding: 8px 24px;
  }
`;
