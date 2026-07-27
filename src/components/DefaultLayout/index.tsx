import Div100vh from 'react-div-100vh';
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

  return (
    <Container>
      <ScrollableContainer>
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
