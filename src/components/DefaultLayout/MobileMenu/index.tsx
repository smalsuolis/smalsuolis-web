import Div100vh from 'react-div-100vh';
import styled from 'styled-components';
import { DefaultLayoutProps, Modal } from '@aplinkosministerija/design-system';
import { device, font } from '../../../styles';
import Icon from '../../Icons';
import { IconName, slugs } from '../../../utils';

interface Props extends DefaultLayoutProps {
  visible: boolean;
  onClose: () => void;
}

// New-design mobile menu: a clean white full-screen panel matching the top nav.
// Nav links use the DS treatment (black text, active in Bold); a single
// login/logout action sits at the bottom.
const MobileMenu = ({
  visible = true,
  loggedIn,
  currentRoute,
  menuRoutes,
  logo,
  onLogin,
  onLogout,
  onRouteSelected,
  onClose,
}: Props) => {
  return (
    <Modal visible={visible} onClose={onClose}>
      <Panel>
        <Header>
          <div onClick={onClose}>{logo}</div>
          <CloseButton onClick={onClose} aria-label="Uždaryti">
            <Icon name={IconName.close} />
          </CloseButton>
        </Header>

        <Links>
          {menuRoutes?.map((route, index) => (
            <NavLink
              key={`m_menu_${route.slug}_${index}`}
              $isActive={route.slug === currentRoute?.slug}
              onClick={() => {
                onRouteSelected(route.slug);
                onClose();
              }}
            >
              {route.title}
            </NavLink>
          ))}
        </Links>

        <Footer>
          {/* Profilis has no icon, so filterMenuRoutes leaves it out of the list
              above — on desktop it lives in the account dropdown, and here it
              sits beside the logout action. */}
          {loggedIn && (
            <ProfileLink
              onClick={() => {
                onRouteSelected(slugs.profile);
                onClose();
              }}
            >
              Profilis
            </ProfileLink>
          )}
          <LoginButton
            onClick={() => {
              if (loggedIn) {
                onLogout();
              } else {
                onLogin();
              }
              onClose();
            }}
          >
            {loggedIn ? 'Atsijungti' : 'Prisijungti'}
          </LoginButton>
        </Footer>
      </Panel>
    </Modal>
  );
};

export default MobileMenu;

const Panel = styled(Div100vh)`
  width: 100%;
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  flex-direction: column;
  padding: 0 20px 32px;

  @media ${device.desktop} {
    max-width: 480px;
    min-height: fit-content;
    border-radius: 16px;
    padding: 24px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  flex-shrink: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const Links = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 24px;
`;

const NavLink = styled.div<{ $isActive: boolean }>`
  cursor: pointer;
  padding: 14px 8px;
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  ${({ $isActive }) => font('2xl', $isActive ? 700 : 400)};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.7)};

  &:active {
    background: ${({ theme }) => theme.colors.grey[300]};
  }
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding-top: 32px;
`;

const ProfileLink = styled.button`
  width: 100%;
  ${font('base', 500)};
  padding: 16px;
  border-radius: 100px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const LoginButton = styled.button`
  width: 100%;
  ${font('base', 500)};
  padding: 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
`;
