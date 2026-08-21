import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../../styles';
import Button from '../ui/Button';
import { useAuthModal } from '../auth/AuthModalContext';

// Two side-by-side call-to-action cards: a green photo card (brand statement)
// and a black card driving registration/subscription.
const CtaCards = () => {
  const { open } = useAuthModal();
  return (
    <Grid>
      <GreenCard>
        <GreenText>
          Darome tą, nes esame
          <br />
          smalsūs. Kaip ir tu!
        </GreenText>
      </GreenCard>

      <BlackCard>
        <BlackText>
          <BlackTitle>
            Tapk Smalsuolio
            <br />
            prenumeratoriumi
          </BlackTitle>
          <BlackCopy>
            Užsiregistruok. Pažymėk tave dominančias įvykių kategorijas. Gauk elektroniniu paštu
            naujausią informaciją apie tai, kas įvyko.
          </BlackCopy>
        </BlackText>
        <Button variant="light" size="lg" onClick={() => open('register')}>
          Tapk Smalsiu
        </Button>
      </BlackCard>
    </Grid>
  );
};

export default CtaCards;

// Full-bleed row: the green card runs off the left edge of the viewport and the
// black card off the right (matching the Figma), so only their inner corners are
// rounded. The whole component spans full width; no Section wrapper.
const Grid = styled.div`
  display: grid;
  /* Design: 836 + 24 gap + 580 in a 1440 band — the image panel is the wider
     of the two, not an equal half. */
  grid-template-columns: 836fr 580fr;
  gap: 24px;
  width: 100%;
  margin-top: 80px;

  @media ${device.mobileL} {
    grid-template-columns: 1fr;
    padding: 0 20px;
    margin-top: 48px;
  }
`;

// Inner content aligns to the page's centered content column (max-width 1216 +
// 32px gutter), even though the card background bleeds to the screen edge. On
// screens narrower than the column, falls back to the card's own 48px padding.
const contentGutter = `max(48px, calc((100vw - ${CONTENT_WIDTH}) / 2 + 32px))`;

const Card = styled.div`
  border-radius: 20px;
  padding: 48px;
  /* Design frame height for the band. */
  min-height: 538px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  @media ${device.mobileL} {
    padding: 32px;
    min-height: 260px;
  }
`;

const GreenCard = styled(Card)`
  position: relative;
  overflow: hidden;
  border-radius: 0 20px 20px 0;
  padding-left: ${contentGutter};
  background:
    linear-gradient(180deg, rgba(126, 236, 155, 0.3) 0%, #20853b 100%),
    url('/home/cta_city.png') center / cover no-repeat;

  @media ${device.mobileL} {
    border-radius: 20px;
    padding-left: 32px;
  }
`;

const GreenText = styled.div`
  ${font('5xl')};
  color: ${({ theme }) => theme.colors.white};
  position: relative;
`;

const BlackCard = styled(Card)`
  background: ${({ theme }) => theme.colors.black};
  justify-content: flex-start;
  gap: 40px;
  border-radius: 20px 0 0 20px;

  @media ${device.mobileL} {
    border-radius: 20px;
  }
`;

const BlackText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const BlackTitle = styled.div`
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.white};
`;

const BlackCopy = styled.p`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  max-width: 420px;
`;
