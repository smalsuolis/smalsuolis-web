import { useState } from 'react';
import styled from 'styled-components';
import { device, font } from '../../styles';
import Icon from '../Icons';
import { IconName } from '../../utils';
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

  return (
    <Bar>
      <Inner>
        <LogoContainer onClick={onGoHome}>{logo}</LogoContainer>

        <Links>
          {menuRoutes.map((route: any, index: number) => (
            <NavLink
              key={`topnav_${route.slug}_${index}`}
              $isActive={!!currentRoute?.slug && currentRoute.slug.includes(route.slug)}
              onClick={() => onRouteSelected(route.slug)}
            >
              {route.title}
            </NavLink>
          ))}
        </Links>

        <Right>
          {loggedIn ? (
            <AccountWrapper
              onMouseLeave={() => setAccountOpen(false)}
              onClick={() => setAccountOpen((o) => !o)}
            >
              <Avatar>
                <Icon name={IconName.person} />
              </Avatar>
              <Chevron name={IconName.dropdownArrow} $open={accountOpen} />
              {accountOpen && (
                <AccountMenu>
                  <AccountItem onClick={() => onRouteSelected('/profilis')}>Profilis</AccountItem>
                  <AccountItem onClick={() => onLogout()}>Atsijungti</AccountItem>
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

const Bar = styled.header`
  position: relative;
  width: 100%;
  background: transparent;
  /* Must sit above the homepage hero, which is pulled up underneath it with a
     negative margin. The hero establishes its own stacking context, so the nav
     needs an explicit z-index on a positioned box to paint over it. */
  z-index: 100;
`;

const Inner = styled.nav`
  max-width: 1216px;
  margin: 0 auto;
  height: 72px;
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
  gap: 32px;

  @media ${device.mobileL} {
    display: none;
  }
`;

const NavLink = styled.div<{ $isActive: boolean }>`
  cursor: pointer;
  ${font('base', 500)};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.text.primary : theme.colors.grey[600]};
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
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
  gap: 6px;
  cursor: pointer;

  @media ${device.mobileL} {
    display: none;
  }
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

const AccountMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 6px;
  min-width: 160px;
  z-index: 30;
`;

const AccountItem = styled.div`
  ${font('base', 500)};
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.grey[300]};
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
