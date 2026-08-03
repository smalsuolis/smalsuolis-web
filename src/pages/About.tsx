import styled from 'styled-components';
import { device, font } from '../styles';
import { Section } from '../components/ui/Section';
import StatRow from '../components/home/StatRow';
import CtaCards from '../components/home/CtaCards';

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
      <Hero>
        <Heading>
          Smalsuolis visiems
          <br />
          smalsiems žmonėms
        </Heading>
      </Hero>

      <Section>
        <Intro>
          <IntroStrong>Mūsų valstybėje vyksta daug įvykių</IntroStrong>, tačiau apie juos nežinome
          arba sužinome per vėlai. Nusprendėme tą pakeisti –{' '}
          <IntroStrong>suteikti galimybę visiems piliečiams</IntroStrong> sekti kas vyksta šalyje
          realiu laiku.
        </Intro>
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
  margin-top: -72px;
  @media ${device.mobileL} {
    margin-top: -64px;
  }

  & > section {
    margin-top: 80px;
  }
  & > section:first-of-type {
    margin-top: 96px;
  }

  @media ${device.mobileL} {
    & > section {
      margin-top: 48px;
    }
    & > section:first-of-type {
      margin-top: 48px;
    }
  }
`;

// Hero: the same 1440x436 green band as the homepage, artwork included — the
// Figma About frame carries an identical texture layer, not flat green.
const Hero = styled.div`
  width: 100%;
  background:
    url('/hero_bg.png') center / 100% 100% no-repeat,
    #7eec9b;
  min-height: 436px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 96px 32px 64px;

  @media ${device.mobileL} {
    min-height: 0;
    padding: 96px 20px 56px;
  }
`;

const Heading = styled.h1`
  ${font('6xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin: 0;

  @media ${device.mobileL} {
    ${font('3xl')};
    font-weight: 700;
  }
`;

const Intro = styled.p`
  ${font('3xl')};
  font-weight: 400;
  text-align: center;
  color: ${({ theme }) => theme.colors.grey[500]};
  max-width: 876px;
  margin: 0 auto;
`;

const IntroStrong = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Grey band behind the "Domina" section.
const GreyBand = styled.div`
  width: 100%;
  background: #fafafa;
  padding: 72px 0;
  margin-top: 80px;

  @media ${device.mobileL} {
    padding: 48px 0;
    margin-top: 48px;
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

  @media ${device.tablet} {
    flex-direction: column;
    align-items: flex-start;
    gap: 32px;
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
