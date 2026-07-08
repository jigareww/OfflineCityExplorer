import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      gcTime: 15 * 60 * 1000,   // 15 minutes garbage collection
      retry: false,             // Retries are handled directly in Axios interceptors
      refetchOnWindowFocus: false,
    },
  },
});
