import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../../styles';
import { Menu, MenuItem } from '../ui/Menu';
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
    <Bar $overHero={overHero} $overMap={currentRoute?.slug === slugs.map}>
      <Inner>
        <LogoContainer $overHero={overHero} onClick={onGoHome}>
          {logo}
        </LogoContainer>

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

      <MobileMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        overHero={overHero}
        {...props}
      />
    </Bar>
  );
};

export default TopNav;

const Bar = styled.header<{ $overHero: boolean; $overMap: boolean }>`
  position: relative;
  width: 100%;
  background: ${({ $overHero, theme }) => ($overHero ? 'transparent' : theme.colors.white)};
  /* Inset rule, not a border: the design's navbar is 80px tall including its
     hairline, and a border would make the bar 81 and shift every page down.
     The map frames draw no rule — the bar sits straight on the map. */
  ${({ $overHero, $overMap, theme }) =>
    !$overHero && !$overMap && `box-shadow: inset 0 -1px 0 ${theme.colors.grey[300]};`}

  /* The phone frames tint the bar instead of painting it solid white. */
  @media ${device.mobileL} {
    ${({ $overHero }) =>
      !$overHero &&
      `background: rgba(250, 250, 250, 0.9);
       box-shadow: inset 0 -1px 0 #E8E8E8;`}
  }
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
    padding: 0 16px;
  }
`;

// The mark is green wherever the bar is white, and black only while the bar is
// transparent over the green hero — the wordmark stays black either way.
const LogoContainer = styled.div<{ $overHero: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ $overHero }) => ($overHero ? '#000000' : '#53ba6d')};

  /* Design: a 136x18 mark on desktop, 160x21 on the phone. */
  svg {
    width: 136px;
    height: auto;
  }

  @media ${device.mobileL} {
    svg {
      width: 160px;
    }
  }
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  gap: 36px;

  @media ${device.mobileL} {
    display: none;
  }
`;

const NavLink = styled.div<{ $isActive: boolean }>`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  ${({ $isActive }) => font('base', $isActive ? 700 : 400)};
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
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 48px;
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.6rem;
  color: #0f172a;
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
  width: 281px;
  z-index: 30;
`;

const AccountCard = styled(Menu)`
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
`;

// `$muted` marks the terminal action (Atsijungti), which sits on a faint grey to
// set it apart from the navigation entries above it.
const AccountItem = styled(MenuItem)<{ $muted?: boolean }>`
  white-space: nowrap;
  background: ${({ $muted }) => ($muted ? '#fafafa' : 'transparent')};
`;

const LoginButton = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  height: 40px;
  cursor: pointer;
  ${font('base')};
  padding: 8px 24px;
  border-radius: 54px;
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
  padding: 0;
  display: none;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;

  @media ${device.mobileL} {
    display: flex;
    align-items: center;
  }
`;
