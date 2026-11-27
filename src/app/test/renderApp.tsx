import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { createQueryClient } from '@/shared/api/queryClient';
import { AuthProvider } from '@/shared/auth/AuthContext';
import { ThemeProvider } from '../providers/ThemeProvider';
import { createAppRoutes } from '../router/router';

export function renderAppAt(initialEntries: string[]) {
  const queryClient = createQueryClient();
  const router = createMemoryRouter(createAppRoutes(), { initialEntries });

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  };
}
