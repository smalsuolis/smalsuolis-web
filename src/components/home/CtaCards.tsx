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
        {/* The trailing space survives the break, so the headline still reads
            as a sentence at widths where the break is dropped. */}
        <GreenText>
          Darome tą, nes esame <br />
          smalsūs. Kaip ir tu!
        </GreenText>
      </GreenCard>

      <BlackCard>
        <BlackText>
          <BlackTitle>
            Tapk Smalsuolio <br />
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

  /* Between the phone and the 1440 frame the 836/580 split leaves the black
     card too narrow for its copy — even the two halves. */
  @media ${device.tablet} {
    grid-template-columns: 1fr 1fr;
  }
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

  @media ${device.tablet} {
    min-height: 420px;
  }

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

  @media ${device.tablet} {
    padding: 56px 40px;
    justify-content: center;
  }

  /* No counterpart on the 393 frame. */
  @media ${device.mobileL} {
    display: none;
  }
`;

const GreenText = styled.div`
  ${font('5xl')};
  color: ${({ theme }) => theme.colors.white};
  position: relative;

  /* The line breaks are set for the 1440 frame's column width; below it they
     leave one word per line, so let the headline flow instead. */
  @media ${device.tablet} {
    ${font('3xl')};

    br {
      display: none;
    }
  }
`;

const BlackCard = styled(Card)`
  background: ${({ theme }) => theme.colors.black};
  justify-content: center;
  gap: 40px;
  padding: 0 80px;
  border-radius: 20px 0 0 20px;

  @media ${device.tablet} {
    gap: 24px;
    padding: 0 40px;
  }

  @media ${device.mobileL} {
    /* The phone frame carries only this card, full-bleed and square. */
    border-radius: 0;
    padding: 77px 43px 77px 37px;
    gap: 40px;
  }
`;

const CtaButtonWrap = styled.div`
  button {
    width: 420px;
    max-width: 100%;
  }

  @media ${device.tablet} {
    button {
      width: 100%;
    }
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

  @media ${device.tablet} {
    ${font('2xl')};

    br {
      display: none;
    }
  }
`;

const BlackCopy = styled.p`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  max-width: 420px;
`;
