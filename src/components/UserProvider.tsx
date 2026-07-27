import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useEffect } from 'react';
import api from '../utils/api';
import { timeRangeQuery, TimeRanges } from '../utils/types';

const ALL_TIME = timeRangeQuery[TimeRanges.ALL_TIME];

export type UserContextType = {
  data: any;
  error: Error | null;
  isLoading: boolean;
  loggedIn: boolean;
  subscriptionsCount: number;
};

const defaultValue: UserContextType = {
  data: null,
  error: null,
  isLoading: true,
  loggedIn: false,
  subscriptionsCount: 0,
};

export const UserContext: any = createContext<UserContextType>(defaultValue);

export const UserProvider = ({ children }: any) => {
  const queryClient = useQueryClient();

  // Prefetch the all-time stats at app startup so the StatRow numbers (homepage,
  // Apie mus) are already cached by the time any of those pages render — no
  // late pop-in. Shares the ['home-stats', ALL_TIME] key those components use.
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['home-stats', ALL_TIME],
      queryFn: () => api.getStats(ALL_TIME),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const {
    data,
    error: userError,
    isLoading: userLoading,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => {
      return api.getUserInfo();
    },
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const error = userError;
  const isLoading = userLoading;
  const loggedIn = !error && !!data?.id;

  return (
    <UserContext.Provider
      value={{
        data,
        error,
        isLoading,
        loggedIn,
        subscriptionsCount: data?.subscriptions || 0,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
