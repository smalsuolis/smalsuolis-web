import styled from 'styled-components';
import { font } from '../../styles';
import Button from '../ui/Button';
import { useAuthModal } from '../auth/AuthModalContext';

// Green gradient CTA at the bottom of the stats page. Decorative wavy lines sit
// on the right (inline SVG, self-contained). Drives registration.
const SubscribeBanner = () => {
  const { open } = useAuthModal();
  return (
    <Banner>
      <Waves
        viewBox="0 0 480 260"
        preserveAspectRatio="xMaxYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={i}
            d={`M-20 ${120 + i * 22} C 120 ${60 + i * 22}, 320 ${180 + i * 22}, 520 ${90 + i * 22}`}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
          />
        ))}
      </Waves>
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

const Banner = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  padding: 56px;
  margin-top: 64px;
  background: linear-gradient(120deg, #8ee6a2 0%, #6dd487 55%, #57c877 100%);

  @media (max-width: 868px) {
    padding: 40px 28px;
    margin-top: 48px;
  }
`;

const Waves = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
