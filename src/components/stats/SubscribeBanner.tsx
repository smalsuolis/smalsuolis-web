import styled from 'styled-components';
import { font } from '../../styles';
import Button from '../ui/Button';
import { useAuthModal } from '../auth/AuthModalContext';

// Green CTA at the bottom of the stats page, on the exported Figma artwork
// (public/tapk_smalsiu.png). Drives registration.
const SubscribeBanner = () => {
  const { open } = useAuthModal();
  return (
    <Banner>
      <Content>
        <Title>
          Tapk Smalsuolio
          <br />
          prenumeratoriumi
        </Title>
        <Copy>
          Užsiregistruok. Pažymėk tave dominančias įvykių kategorijas. Gauk elektroniniu paštu
          naujausią informaciją apie tai, kas įvyko
        </Copy>
        <Button variant="dark" size="lg" onClick={() => open('register')}>
          Tapk Smalsiu
        </Button>
      </Content>
    </Banner>
  );
};

export default SubscribeBanner;

// Flattened PNG export (4008x1137, ~3.5:1) — the white line work is already
// baked in, so no blend-mode reinterpretation like the SVG had. Stretched to
// the banner box so the whole sweep stays visible; flat base green backs it.
const Banner = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  padding: 56px;
  margin-top: 64px;
  background:
    url('/tapk_smalsiu.png') center / 100% 100% no-repeat,
    #7eec9b;

  @media (max-width: 868px) {
    padding: 40px 28px;
    margin-top: 48px;
  }
`;

const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
  max-width: 560px;
`;

const Title = styled.div`
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.text?.primary};
`;

const Copy = styled.p`
  ${font('base')};
  color: ${({ theme }) => theme.colors.tertiary};
  margin: 0;
  max-width: 460px;
`;
