import { Navigate } from 'react-router-dom';
import { slugs } from '../../utils';
import { AuthModalType } from './AuthModalContext';

// Auth is now a modal over the current page, not a standalone route. Old auth
// URLs (/prisijungimas, /registracija, /pamirsau) redirect to the homepage with
// the corresponding modal opened via ?auth=… so bookmarks/links still work.
const AuthRouteRedirect = ({ type }: { type: AuthModalType }) => (
  <Navigate to={`${slugs.home}?auth=${type}`} replace />
);

export default AuthRouteRedirect;
