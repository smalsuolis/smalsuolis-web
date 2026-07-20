import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { slugs } from '../../utils';
import Button from '../ui/Button';

// Two side-by-side call-to-action cards: a green photo card (brand statement)
// and a black card driving registration/subscription.
const CtaCards = () => {
  const navigate = useNavigate();
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
        <BlackTitle>
          Tapk Smalsuolio
          <br />
          prenumeratoriumi
        </BlackTitle>
        <BlackCopy>
          Užsiregistruok. Pažymėk tave dominančias įvykių kategorijas. Gauk elektroniniu paštu
          naujausią informaciją apie tai, kas įvyko.
        </BlackCopy>
        <Button variant="light" size="lg" onClick={() => navigate(slugs.registration)}>
          Tapk Smalsiu
        </Button>
      </BlackCard>
    </Grid>
  );
};

export default CtaCards;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media ${device.mobileL} {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border-radius: 32px;
  padding: 48px;
  min-height: 320px;
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
  background:
    linear-gradient(180deg, rgba(43, 122, 74, 0.1) 0%, rgba(27, 76, 40, 0.75) 100%),
    url('/home/cta_city.png') center / cover no-repeat;
`;

const GreenText = styled.div`
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.white};
  position: relative;
`;

const BlackCard = styled(Card)`
  background: ${({ theme }) => theme.colors.black};
  justify-content: flex-start;
  gap: 16px;
`;

const BlackTitle = styled.div`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.white};
`;

const BlackCopy = styled.p`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[400]};
  margin: 0;
  max-width: 420px;
`;
