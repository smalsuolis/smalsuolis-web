import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../../styles';
import Icon from '../Icons';
import { IconName, slugs } from '../../utils';
import MobileMenu from './MobileMenu';
import { DefaultLayoutProps } from './index';

// New-design top navigation bar (replaces the old left sidebar).
// Desktop: logo left, route links centered, account/login control right.
// Mobile: logo left, burger opens the existing MobileMenu modal.
const TopNav = (props: DefaultLayoutProps) => {
  const {
    loggedIn,
    loginSlug,
    menuRoutes,
    logo,
    onLogin,
    onLogout,
    onRouteSelected,
    currentRoute,
    onGoHome,
  } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Click-to-toggle, dismissed by an outside click or Escape. Closing on
  // mouseleave instead would snatch the menu away as the pointer crosses the
  // gap between the avatar and the panel below it.
  useEffect(() => {
    if (!accountOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  // These two pull the hero up underneath the bar, so it has to stay see-through.
  const overHero = currentRoute?.slug === slugs.home || currentRoute?.slug === slugs.about;

  return (
    <Bar $overHero={overHero}>
      <Inner>
        <LogoContainer onClick={onGoHome}>{logo}</LogoContainer>

        <Links>
          {menuRoutes.map((route: any, index: number) => (
            <NavLink
              key={`topnav_${route.slug}_${index}`}
              // Exact match, plus nested routes under a section (e.g.
              // /prenumeratos/:id highlights Prenumeratos). A plain `includes`
              // would light up "/" — the home slug — on every page.
              $isActive={
                currentRoute?.slug === route.slug ||
                (route.slug !== slugs.home && !!currentRoute?.slug?.startsWith(`${route.slug}/`))
              }
              onClick={() => onRouteSelected(route.slug)}
            >
              {route.title}
            </NavLink>
          ))}
        </Links>

        <Right>
          {loggedIn ? (
            <AccountWrapper ref={accountRef}>
              <AccountTrigger
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <Avatar>
                  <Icon name={IconName.person} />
                </Avatar>
                <Chevron name={IconName.dropdownArrow} $open={accountOpen} />
              </AccountTrigger>
              {accountOpen && (
                <AccountMenu role="menu">
                  <AccountCard>
                    {[
                      { label: 'Mano profilis', slug: slugs.profile },
                      { label: 'Prenumeratos', slug: slugs.subscriptions },
                      { label: 'Mano įvykiai', slug: slugs.myEvents },
                    ].map((item) => (
                      <AccountItem
                        key={item.slug}
                        role="menuitem"
                        onClick={() => {
                          onRouteSelected(item.slug);
                          setAccountOpen(false);
                        }}
                      >
                        {item.label}
                      </AccountItem>
                    ))}
                    <AccountItem
                      role="menuitem"
                      $muted
                      onClick={() => {
                        setAccountOpen(false);
                        onLogout();
                      }}
                    >
                      Atsijungti
                    </AccountItem>
                  </AccountCard>
                </AccountMenu>
              )}
            </AccountWrapper>
          ) : (
            <LoginButton $isActive={loginSlug === currentRoute?.slug} onClick={onLogin}>
              Prisijungti
            </LoginButton>
          )}
          <Burger onClick={() => setShowMenu(true)} aria-label="Meniu">
            <Icon name={IconName.burger} />
          </Burger>
        </Right>
      </Inner>

      <MobileMenu visible={showMenu} onClose={() => setShowMenu(false)} {...props} />
    </Bar>
  );
};

export default TopNav;

const Bar = styled.header<{ $overHero: boolean }>`
  position: relative;
  width: 100%;
  background: ${({ $overHero, theme }) => ($overHero ? 'transparent' : theme.colors.white)};
  ${({ $overHero, theme }) => !$overHero && `border-bottom: 1px solid ${theme.colors.grey[300]};`}
  /* Must sit above the homepage hero, which is pulled up underneath it with a
     negative margin. The hero establishes its own stacking context, so the nav
     needs an explicit z-index on a positioned box to paint over it. */
  z-index: 100;
`;

const Inner = styled.nav`
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  gap: 24px;

  @media ${device.mobileL} {
    padding: 0 20px;
    height: 64px;
  }
`;

const LogoContainer = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  gap: 36px; /* DS Navbar item gap */

  @media ${device.mobileL} {
    display: none;
  }
`;

// Matches the design-system Navbar: 16px black links, letter-spacing -0.02em,
// the active item in Bold (700) and the rest in Regular (400) — weight, not
// color, signals the active route. Inactive links carry a slight opacity so the
// active one still reads first (mirrors the DS's de-emphasized nav treatment).
const NavLink = styled.div<{ $isActive: boolean }>`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  ${({ $isActive }) => font('base', $isActive ? 700 : 400)};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.64)};
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

const AccountWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  @media ${device.mobileL} {
    display: none;
  }
`;

const AccountTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.6rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

// Anchored flush to the trigger; the 8px visual offset comes from padding, so
// the gap belongs to the panel's own hit area instead of being dead space.
const AccountMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  padding-top: 10px;
  min-width: 232px;
  z-index: 30;
`;

// Square-cornered white panel on a soft, wide-spread shadow — the card reads as
// a flat sheet rather than a rounded popover.
const AccountCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

// Full-bleed rows separated by hairlines that run the whole panel width.
// `$muted` marks the terminal action (Atsijungti), which sits on a faint grey
// to set it apart from the navigation entries above it.
const AccountItem = styled.div<{ $muted?: boolean }>`
  ${font('base', 400)};
  padding: 18px 24px;
  cursor: pointer;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ $muted }) => ($muted ? '#f7f7f7' : 'transparent')};

  & + & {
    border-top: 1px solid #eeeeee;
  }

  &:hover {
    background: ${({ $muted }) => ($muted ? '#f0f0f0' : '#fafafa')};
  }
`;

const LoginButton = styled.div<{ $isActive: boolean }>`
  cursor: pointer;
  ${font('base', 500)};
  padding: 10px 20px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.grey[700]};
  }

  @media ${device.mobileL} {
    display: none;
  }
`;

const Burger = styled.button`
  display: none;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;

  @media ${device.mobileL} {
    display: flex;
    align-items: center;
  }
`;
