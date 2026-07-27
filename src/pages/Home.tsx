import styled from 'styled-components';
import { device, font } from '../styles';
import { Section } from '../components/ui/Section';
import HeroSearch from '../components/home/HeroSearch';
import StatRow from '../components/home/StatRow';
import CategoryBrowse from '../components/home/CategoryBrowse';
import RecentEvents from '../components/home/RecentEvents';
import CtaCards from '../components/home/CtaCards';

// Public landing page. Rendered full-bleed (outside the padded inner layout)
// so the hero and footer reach the window edges. Content sections are width-
// capped by the shared <Section> wrapper.
const Home = () => {
  return (
    <Page>
      <HeroSearch />

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

      <Section>
        <CategoryBrowse />
      </Section>

      <Section>
        <RecentEvents />
      </Section>

      <CtaCards />
    </Page>
  );
};

export default Home;

const Page = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  flex-direction: column;

  /* Pull the hero up under the transparent top nav so the green band starts
     at the very top of the viewport, with the nav floating over it. */
  margin-top: -72px;
  @media ${device.mobileL} {
    margin-top: -64px;
  }

  /* Vertical rhythm between top-level sections. First section (intro) needs
     extra top space to clear the search bar that overlaps the hero. */
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
      /* Search bar overhangs the hero by ~24px on mobile; clear it. */
      margin-top: 48px;
    }
  }
`;

const Intro = styled.p`
  ${font('2xl')};
  font-weight: 400;
  text-align: center;
  color: ${({ theme }) => theme.colors.grey[500]};
  max-width: 760px;
  margin: 0 auto;
`;

const IntroStrong = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
`;
