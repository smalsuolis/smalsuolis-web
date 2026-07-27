import { useAuthModal } from './AuthModalContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotModal from './ForgotModal';

// Renders whichever auth modal the URL (?auth=…) currently selects, over the
// page. Mounted once near the app root, inside the router + query providers.
const AuthModalRoot = () => {
  const { active } = useAuthModal();

  if (active === 'login') return <LoginModal />;
  if (active === 'register') return <RegisterModal />;
  if (active === 'forgot') return <ForgotModal />;
  return null;
};

export default AuthModalRoot;
