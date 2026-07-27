import { useState } from 'react';
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

// Mobile menu: a clean white full-screen panel matching the top nav. Nav links
// use the DS treatment (black text, active in Bold). When signed in, the
// account entries from the desktop avatar dropdown collapse under a "Profilis"
// group in the same list; signed out, a single Prisijungti button sits at the
// bottom.
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
  const [accountOpen, setAccountOpen] = useState(false);

  // Same entries as the desktop account dropdown (TopNav), minus logout, which
  // is rendered last so it reads as the terminal action.
  const accountItems = [
    { label: 'Mano profilis', slug: slugs.profile },
    { label: 'Prenumeratos', slug: slugs.subscriptions },
    { label: 'Mano įvykiai', slug: slugs.myEvents },
  ];

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

          {/* Account section mirrors the desktop avatar dropdown, collapsed into
              the nav list rather than sitting in a separate footer block. */}
          {loggedIn && (
            <>
              <NavLink
                as="button"
                type="button"
                $isActive={accountOpen}
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
              >
                Profilis
                <Chevron name={IconName.dropdownArrow} $open={accountOpen} />
              </NavLink>
              {accountOpen && (
                <SubLinks>
                  {accountItems.map((item) => (
                    <SubLink
                      key={item.slug}
                      $isActive={item.slug === currentRoute?.slug}
                      onClick={() => {
                        onRouteSelected(item.slug);
                        onClose();
                      }}
                    >
                      {item.label}
                    </SubLink>
                  ))}
                  <SubLink
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                  >
                    Atsijungti
                  </SubLink>
                </SubLinks>
              )}
            </>
          )}
        </Links>

        {!loggedIn && (
          <Footer>
            <LoginButton
              onClick={() => {
                onLogin();
                onClose();
              }}
            >
              Prisijungti
            </LoginButton>
          </Footer>
        )}
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
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
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

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.8rem;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

// Indented, smaller entries under the Profilis group — subordinate to the
// top-level routes without introducing a separate panel.
const SubLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 2px 0 6px;
  padding-left: 12px;
  border-left: 2px solid ${({ theme }) => theme.colors.grey[300]};
`;

const SubLink = styled.div<{ $isActive?: boolean }>`
  cursor: pointer;
  padding: 12px 8px;
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.text.primary};
  ${({ $isActive }) => font('lg', $isActive ? 700 : 400)};
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

const LoginButton = styled.button`
  width: 100%;
  ${font('base', 500)};
  padding: 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
`;
