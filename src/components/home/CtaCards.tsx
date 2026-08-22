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
        <CtaButtonWrap>
          <Button variant="light" onClick={() => open('register')}>
            Tapk Smalsiu
          </Button>
        </CtaButtonWrap>
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
  margin-top: 54px;
  /* The footer keeps a 42px lead-in of its own; the design leaves 114 below
     this band, so the remainder lives here. */
  margin-bottom: 72px;

  @media ${device.mobileL} {
    grid-template-columns: 1fr;
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const Card = styled.div`
  border-radius: 20px;
  /* Design frame height for the band. */
  min-height: 538px;
  display: flex;
  flex-direction: column;

  @media ${device.mobileL} {
    min-height: 0;
  }
`;

const GreenCard = styled(Card)`
  position: relative;
  overflow: hidden;
  border-radius: 0 20px 20px 0;
  /* Heading sits 141 from the card's left edge and 179 from its top. */
  padding: 179px 48px 215px 141px;
  justify-content: flex-start;
  background:
    linear-gradient(180deg, rgba(126, 236, 155, 0.3) 0%, #20853b 100%),
    url('/home/cta_city.png') center / cover no-repeat;

  /* No counterpart on the 393 frame. */
  @media ${device.mobileL} {
    display: none;
  }
`;

const GreenText = styled.div`
  ${font('5xl')};
  color: ${({ theme }) => theme.colors.white};
  position: relative;
`;

const BlackCard = styled(Card)`
  background: ${({ theme }) => theme.colors.black};
  justify-content: center;
  gap: 40px;
  padding: 0 80px;
  border-radius: 20px 0 0 20px;

  @media ${device.mobileL} {
    /* The phone frame carries only this card, full-bleed and square. */
    border-radius: 0;
    padding: 77px 43px 77px 37px;
  }
`;

const CtaButtonWrap = styled.div`
  button {
    width: 420px;
  }

  @media ${device.mobileL} {
    button {
      width: 313px;
    }
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

  @media ${device.mobileL} {
    ${font('2xl')};
  }
`;

const BlackCopy = styled.p`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  max-width: 420px;
`;
