import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// The auth modals that overlay the current page. Token-based flows (set/reset
// password from an email link) stay full pages and are NOT part of this.
export type AuthModalType = 'login' | 'register' | 'forgot';

const VALID: AuthModalType[] = ['login', 'register', 'forgot'];

interface AuthModalContextValue {
  active: AuthModalType | null;
  open: (type: AuthModalType) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  active: null,
  open: () => undefined,
  close: () => undefined,
});

// Drives the auth modals from the URL (?auth=login|register|forgot) so they are
// deep-linkable and survive refresh, while still overlaying whatever page the
// user is on. `open`/`close` just add/remove the `auth` search param.
export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = searchParams.get('auth');
  const active = (VALID.includes(raw as AuthModalType) ? raw : null) as AuthModalType | null;

  const open = useCallback(
    (type: AuthModalType) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('auth', type);
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const close = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('auth');
        return next;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const value = useMemo(() => ({ active, open, close }), [active, open, close]);

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};

export const useAuthModal = () => useContext(AuthModalContext);
