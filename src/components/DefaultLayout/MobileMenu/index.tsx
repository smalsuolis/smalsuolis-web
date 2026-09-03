import { useState } from 'react';
import styled from 'styled-components';
import { DefaultLayoutProps, Modal } from '@aplinkosministerija/design-system';
import { device, font } from '../../../styles';
import Icon from '../../Icons';
import { IconName, slugs } from '../../../utils';

interface Props extends DefaultLayoutProps {
  visible: boolean;
  onClose: () => void;
  // The bar is see-through over the hero, so the panel that replaces it takes
  // the hero's green; everywhere else the bar is white and so is the panel.
  overHero?: boolean;
}

// Mobile menu: a full-screen panel that carries on from the bar it replaces —
// the hero's green where the bar is see-through, white where the bar is white.
// One centred column on a 48px pitch; when signed in, the account entries from
// the desktop avatar dropdown collapse under a "Profilis" group in the same
// column, and signed out a single Prisijungti button sits at the bottom.
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
  overHero = false,
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
      <Panel $green={overHero}>
        <Header>
          <LogoContainer $green={overHero} onClick={onClose}>
            {logo}
          </LogoContainer>
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
              <ProfileLink
                as="button"
                type="button"
                $isActive={accountOpen}
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
              >
                Profilis
                <Chevron name={IconName.dropdownArrow} $open={accountOpen} />
              </ProfileLink>
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

// The hero's own green, so opening the menu over it reads as the bar growing
// rather than a separate sheet dropping in.
const HERO_GREEN = '#94EFAD';

// It drops from the bar and ends 20px under the last entry — the frame gives it
// 558 of the phone's 800, not the whole screen.
const Panel = styled.div<{ $green: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: ${({ $green, theme }) => ($green ? HERO_GREEN : theme.colors.white)};
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;

  @media ${device.desktop} {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: 480px;
    border-radius: 0 0 16px 16px;
  }
`;

// Same 82px as the bar it replaces, with the logo and close on the bar's own
// 16px gutters.
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 82px;
  padding: 0 16px;
  flex-shrink: 0;
`;

// Same rule as the bar: the mark is black on the green panel and green on the
// white one, so it never disappears into its own background.
const LogoContainer = styled.div<{ $green: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${({ $green }) => ($green ? '#000000' : '#53ba6d')};
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

// One centred column: items are 24 tall on a 48 pitch, so the gap is 24.
const Links = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const NavLink = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.black};
  ${({ $isActive }) => font('base', $isActive ? 700 : 400)};
`;

// The design sets the group heading a weight above the routes under it.
const ProfileLink = styled(NavLink)`
  ${font('base', 500)};
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.8rem;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

// The account entries continue the same column on the same pitch — the design
// gives them no indent or rule of their own.
const SubLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const SubLink = styled.div<{ $isActive?: boolean }>`
  height: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.black};
  ${({ $isActive }) => font('base', $isActive ? 700 : 400)};
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding: 32px 20px;
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
