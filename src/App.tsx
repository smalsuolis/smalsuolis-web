import { filterMenuRoutes, filterRoutes } from '@aplinkosministerija/design-system';
import { useContext } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import LoaderComponent from './components/LoaderComponent';
import { UserContext, UserContextType } from './components/UserProvider';
import { IconName, useGetCurrentRoute, useLogout, routes, slugs } from './utils';
import Icon from './components/Icons';
import DefaultLayout from './components/DefaultLayout';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, loggedIn, subscriptionsCount } = useContext<UserContextType>(UserContext);
  const currentRoute = useGetCurrentRoute();
  const { mutateAsync: logout } = useLogout();

  if (isLoading) return <LoaderComponent />;

  const authRoutes = filterRoutes(routes, loggedIn);
  const menuRoutes = filterMenuRoutes(routes, loggedIn);

  // Logged-in users land on their personalised feed; everyone else lands on
  // the public homepage.
  const mainPage = loggedIn
    ? subscriptionsCount > 0
      ? slugs.myEvents
      : slugs.newSubscription
    : slugs.home;

  const isHome = currentRoute?.slug === slugs.home;

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
      fullBleed={isHome}
      currentRoute={currentRoute}
      menuRoutes={menuRoutes || []}
      logo={<Icon name={IconName.sidebarLogo} />}
      loginSlug={slugs.login}
      onGoHome={() => {
        navigate('/');
      }}
      onLogin={() => navigate(slugs.login)}
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
    </DefaultLayout>
  );
}

export default App;
