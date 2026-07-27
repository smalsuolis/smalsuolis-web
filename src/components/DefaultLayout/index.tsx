import { useEffect, useRef } from 'react';
import Div100vh from 'react-div-100vh';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AppRoute } from '@aplinkosministerija/design-system';
import { device } from '../../styles';
import TopNav from './TopNav';
import Footer from '../home/Footer';

export interface DefaultLayoutProps {
  loggedIn: boolean;
  menuRoutes: AppRoute[];
  onLogin: () => void;
  onLogout: () => void;
  onRouteSelected: (slug: string) => void;
  loginSlug: string;
  children: any;
  onGoHome: () => void;
  logo: JSX.Element;
  currentRoute?: AppRoute;
  // Full-bleed pages (e.g. the homepage) render their own hero/sections edge
  // to edge and manage width internally. Non-bleed pages keep the padded,
  // centered grey content container the inner pages were built against.
  fullBleed?: boolean;
}

const DefaultLayout = (props: DefaultLayoutProps) => {
  const { children, fullBleed } = props;
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Client-side route changes keep the previous scroll offset, so navigating
  // from the bottom of one page lands mid-way down the next. Reset to the top on
  // every path change. Scrolling happens on this container, not the window, so
  // window.scrollTo would be a no-op here.
  //
  // Keyed on pathname only: query-string changes (filters, ?page=, ?view=) must
  // not yank the user back to the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <Container>
      <ScrollableContainer ref={scrollRef}>
        <TopNav {...props} />
        {fullBleed ? children : <InnerContainer>{children}</InnerContainer>}
        <Footer />
      </ScrollableContainer>
    </Container>
  );
};
export default DefaultLayout;

const Container = styled(Div100vh)`
  width: 100vw;
  display: flex;
`;

const ScrollableContainer = styled.div`
  width: 100%;
  min-height: 100%;
  overflow-y: scroll;
  /* Guard: a single over-wide child shouldn't let the whole page pan sideways
     on mobile. Content that genuinely needs width scrolls within its own box. */
  overflow-x: hidden;
  background-color: white;
`;

const InnerContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  @media ${device.desktop} {
    padding: 40px 16px;
    height: fit-content;
    background-color: #f7f7f7;
  }
`;
