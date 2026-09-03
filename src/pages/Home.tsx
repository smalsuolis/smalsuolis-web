import styled from 'styled-components';
import { device, font } from '../styles';
import { Section } from '../components/ui/Section';
import HeroSearch from '../components/home/HeroSearch';
import StatRow from '../components/home/StatRow';
import CategoryBrowse from '../components/home/CategoryBrowse';
import IntroCopy from '../components/home/IntroCopy';
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
        <IntroCopy />
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
  margin-top: -80px;
  @media ${device.mobileL} {
    margin-top: -80px;
  }

  /* Vertical rhythm between top-level sections: the design frame puts 124px
     between every section, and 153px below the hero band — the extra space is
     what clears the search card hanging 66px past the green edge. */
  & > section {
    margin-top: 124px;
  }
  & > section:first-of-type {
    margin-top: 153px;
  }

  @media ${device.mobileL} {
    & > section {
      margin-top: 42px;
    }
    & > section:first-of-type {
      margin-top: 147px;
    }
    /* The mobile frame groups the intro copy and the stat column into one
       block, so the stats sit closer than the section rhythm. */
    & > section:nth-of-type(2) {
      margin-top: 24px;
    }
  }
`;
