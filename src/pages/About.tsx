import styled from 'styled-components';
import { device, font } from '../styles';
import { Section } from '../components/ui/Section';
import HeroSearch from '../components/home/HeroSearch';
import StatRow from '../components/home/StatRow';
import CtaCards from '../components/home/CtaCards';
import IntroCopy from '../components/home/IntroCopy';

// Apie mus (About) page, redesigned per Figma (node 157:21728). Shares the hero
// band, stat row, CTA cards, and footer with the homepage; adds the "Domina, kas
// vyksta aplinkui tave?" two-column section and the "Kaip tai veikia?" 3-step
// cards.
const steps = [
  {
    icon: '/home/about_binoculars.png',
    title: 'Užsiregistruok',
    body: 'Tapk Smalsuolio prenumeratoriumi',
  },
  {
    icon: '/home/about_arrow.png',
    title: 'Pasirink',
    body: 'Pažymėk tave dominančias įvykių kategorijas',
  },
  {
    icon: '/home/about_envelope.png',
    title: 'Gauk naujienas',
    body: 'Gauk elektroniniu paštu naujausią informaciją apie tai, kas įvyko',
  },
];

const About = () => {
  return (
    <Page>
      <HeroSearch
        heading={
          <>
            Smalsuolis visiems
            <br />
            smalsiems žmonėms
          </>
        }
        supportCopy={null}
        showSearch={false}
      />

      <Section>
        <IntroCopy />
      </Section>

      <Section>
        <StatRow />
      </Section>

      <GreyBand>
        <Section>
          <DominaRow>
            <DominaText>
              <DominaTitle>Domina, kas vyksta aplinkui tave?</DominaTitle>
              <DominaBody>
                Mūsų valstybėje vyksta daug įvykių, tačiau apie juos nežinome arba sužinome per
                vėlai. Nusprendėme tą pakeisti - suteikti galimybę visiems piliečiams sekti kas
                vyksta šalyje realiu laiku.
              </DominaBody>
              <DominaBody>
                Šiuo metu galima sekti statybos leidimų išdavimą, statinio rekonstrukciją, griovimą,
                patalpų paskirties keitimą, miško kirtimų leidimus bei įžuvinimą, taip pat
                planuojame turėti želdynų ir želdinių šalinimo leidimus, poveikio aplinkai
                vertinimą, žemės paskirties keitimą ir daugelį kitų.
              </DominaBody>
            </DominaText>
            <DominaMap src="/home/about_map.png" alt="" />
          </DominaRow>
        </Section>
      </GreyBand>

      <Section>
        <Steps>
          <StepsTitle>Kaip tai veikia?</StepsTitle>
          <StepsRow>
            {steps.map((step) => (
              <StepCard key={step.title}>
                <StepIcon src={step.icon} alt="" />
                <StepTitle>{step.title}</StepTitle>
                <StepBody>{step.body}</StepBody>
              </StepCard>
            ))}
          </StepsRow>
        </Steps>
      </Section>

      <CtaCards />
    </Page>
  );
};

export default About;

const Page = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  flex-direction: column;

  /* Pull the hero up under the transparent top nav (see Home). */
  margin-top: -80px;
  @media ${device.mobileL} {
    margin-top: -80px;
  }

  /* Same 124px rhythm as the homepage; without the search card overhanging it,
     the first section clears the hero by the plain rhythm value. */
  & > section {
    margin-top: 124px;
  }

  /* The design leaves 169px above the CTA band here, against the 54 the
     homepage uses. The band is this page's last block. */
  & > div:last-of-type {
    margin-top: 169px;
  }

  @media ${device.mobileL} {
    & > section {
      margin-top: 42px;
    }
    /* The mobile frame groups the intro copy and the stat column into one
       block, as on the homepage. */
    & > section:nth-of-type(2) {
      margin-top: 24px;
    }
    & > div:last-of-type {
      margin-top: 42px;
    }
  }
`;

// Grey band behind the "Domina" section.
const GreyBand = styled.div`
  width: 100%;
  background: #fafafa;
  padding: 52px 0 67px;
  margin-top: 124px;

  @media ${device.mobileL} {
    padding: 24px 0 36px;
    margin-top: 42px;
  }

  /* The Section inside doesn't need the page-level top margin. */
  & > section {
    margin-top: 0;
  }
`;

const DominaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;

  /* The phone frame stacks the illustration ABOVE the copy, so the column runs
     in reverse of the reading order used on desktop. */
  @media ${device.tablet} {
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 16px;
  }
`;

const DominaText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 460px;
`;

const DominaTitle = styled.h2`
  ${font('2xl', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const DominaBody = styled.p`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const DominaMap = styled.img`
  width: 517px;
  max-width: 100%;
  height: auto;
  flex-shrink: 0;
`;

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 42px;
`;

const StepsTitle = styled.h2`
  ${font('2xl', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  text-align: center;
`;

const StepsRow = styled.div`
  display: flex;
  gap: 24px;
  width: 100%;

  @media ${device.mobileL} {
    flex-direction: column;
  }
`;

// Green step card (#e4fbea, radius 9).
const StepCard = styled.div`
  flex: 1 0 0;
  min-width: 0;
  background: #e4fbea;
  border-radius: 9px;
  padding: 24px 16px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
`;

const StepIcon = styled.img`
  width: 120px;
  height: 120px;
  object-fit: contain;
`;

const StepTitle = styled.div`
  ${font('xl', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StepBody = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;
