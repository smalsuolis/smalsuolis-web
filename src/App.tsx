import { filterMenuRoutes, filterRoutes } from '@aplinkosministerija/design-system';
import { useContext, useRef } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import LoaderComponent from './components/LoaderComponent';
import { UserContext, UserContextType } from './components/UserProvider';
import { IconName, useGetCurrentRoute, useLogout, routes, slugs } from './utils';
import Icon from './components/Icons';
import DefaultLayout from './components/DefaultLayout';
import { useAuthModal } from './components/auth/AuthModalContext';
import AuthModalRoot from './components/auth/AuthModalRoot';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const bootedRef = useRef(false);
  const { isLoading, loggedIn, subscriptionsCount } = useContext<UserContextType>(UserContext);
  const currentRoute = useGetCurrentRoute();
  const { mutateAsync: logout } = useLogout();
  const { open: openAuthModal } = useAuthModal();

  // Only the very first load blanks the app. A later refetch — the one a failed
  // request triggers — used to unmount everything, taking any open dialog and
  // its half-filled form with it.
  if (isLoading && !bootedRef.current) return <LoaderComponent />;
  bootedRef.current = true;

  const authRoutes = filterRoutes(routes, loggedIn);
  // Every page frame draws the same bar — Pagrindinis / Žemėlapis /
  // Prenumeratos / Statistika / Apie mus — with Prenumeratos simply absent
  // while signed out. (The "Login register" frames show an older order; the
  // page frames outnumber them five to one.)
  const navOrder = [slugs.home, slugs.map, slugs.subscriptions, slugs.stats, slugs.about];
  const menuRoutes = [...filterMenuRoutes(routes, loggedIn)].sort(
    (a, b) => navOrder.indexOf(a.slug) - navOrder.indexOf(b.slug),
  );

  // Logged-in users land on their personalised feed; everyone else lands on
  // the public homepage.
  const mainPage = loggedIn
    ? subscriptionsCount > 0
      ? slugs.myEvents
      : slugs.newSubscription
    : slugs.home;

  // Home, Apie mus and the map page render edge-to-edge (own hero /
  // full-viewport map), outside the padded inner content container.
  const isFullBleed =
    currentRoute?.slug === slugs.home ||
    currentRoute?.slug === slugs.map ||
    currentRoute?.slug === slugs.about;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }

  return (
    <DefaultLayout
      loggedIn={loggedIn}
      fullBleed={isFullBleed}
      currentRoute={currentRoute}
      menuRoutes={menuRoutes || []}
      logo={<Icon name={IconName.sidebarLogo} />}
      loginSlug={slugs.login}
      onGoHome={() => {
        navigate('/');
      }}
      onLogin={() => openAuthModal('login')}
      onLogout={() => logout()}
      onRouteSelected={(slug) => {
        const eventsPages = [slugs.events, slugs.myEvents];
        const isOnEventsPage = eventsPages.some((s) => location.pathname.startsWith(s));
        const isGoingToEventsPage = eventsPages.some((s) => slug.startsWith(s));
        if (isOnEventsPage && isGoingToEventsPage) {
          navigate(slug + location.search);
        } else {
          navigate(slug);
        }
      }}
    >
      <Routes>
        <Route>
          {authRoutes.map((route, index) => (
            <Route key={`route-${index}`} path={route.slug} element={route.component} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to={mainPage} />} />
      </Routes>
      <AuthModalRoot />
    </DefaultLayout>
  );
}

export default App;
