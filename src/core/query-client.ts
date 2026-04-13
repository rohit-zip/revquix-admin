import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { showErrorToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"

export const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      /**
       * Global query error handler — shows a toast for every failed query.
       * Individual queries don't carry onError in v5, so this is the single
       * place where query-level errors surface to the user.
       */
      onError: (error) => {
        showErrorToast(error as ApiError | NetworkError | Error)
      },
    }),
    mutationCache: new MutationCache({
      /**
       * Global mutation error handler — acts as a safety-net.
       * If the individual mutation already defines its own onError callback
       * (e.g. to set field errors on a form), skip the global toast so the
       * user doesn't see duplicate notifications.
       */
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.onError) return // handled per-mutation
        showErrorToast(error as ApiError | NetworkError | Error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Never retry mutations globally — a failed register/login should not
        // auto-retry (risk of duplicate submissions). Override per-hook when needed.
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()

