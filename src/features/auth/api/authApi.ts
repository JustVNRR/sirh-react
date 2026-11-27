import { httpClient } from '@/shared/api/httpClient';
import type { AuthTokens } from '@/shared/auth/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    httpClient.post<AuthTokens>('/api/v1/auth/login', payload, { skipAuth: true }),

  logout: (refreshToken: string) =>
    httpClient.post<undefined>('/api/v1/auth/logout', { refreshToken }),

  logoutAll: () => httpClient.post<undefined>('/api/v1/auth/logout-all'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    httpClient.post<undefined>('/api/v1/auth/password/forgot', payload, { skipAuth: true }),

  resetPassword: (payload: ResetPasswordPayload) =>
    httpClient.post<undefined>('/api/v1/auth/password/reset', payload, { skipAuth: true }),

  changePassword: (payload: ChangePasswordPayload) =>
    httpClient.post<undefined>('/api/v1/auth/password/change', payload),
};
