import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/shared/auth/tokenStore';
import { env } from '@/shared/config/env';
import { mswServer } from '@/shared/test/mswServer';
import { httpClient } from '../httpClient';
import { ApiError } from '../types';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

describe('httpClient', () => {
  it('uses a single-flight refresh mutex when concurrent requests receive 401', async () => {
    tokenStore.setTokens({
      accessToken: 'expired-token',
      refreshToken: 'valid-refresh-token',
    });

    let refreshCallCount = 0;

    mswServer.use(
      http.post(api('/api/v1/auth/refresh'), async () => {
        refreshCallCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return HttpResponse.json({
          accessToken: 'fresh-token',
          accessTokenExpiresAtUtc: '2026-11-28T00:00:00Z',
          refreshToken: 'next-refresh-token',
          refreshTokenExpiresAtUtc: '2026-12-05T00:00:00Z',
          tokenType: 'Bearer',
        });
      }),
      http.get(api('/api/v1/test/:id'), ({ request, params }) => {
        if (request.headers.get('Authorization') !== 'Bearer fresh-token') {
          return HttpResponse.json(
            { status: 401, title: 'Auth.Expired', detail: 'Token expired' },
            { status: 401 },
          );
        }
        return HttpResponse.json({ id: params.id });
      }),
    );

    const results = await Promise.all([
      httpClient.get<{ id: string }>('/api/v1/test/1'),
      httpClient.get<{ id: string }>('/api/v1/test/2'),
      httpClient.get<{ id: string }>('/api/v1/test/3'),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
    expect(tokenStore.getAccessToken()).toBe('fresh-token');
    expect(tokenStore.getRefreshToken()).toBe('next-refresh-token');
  });

  it('clears tokens and notifies logout when refresh fails with 401', async () => {
    tokenStore.setTokens({
      accessToken: 'expired-token',
      refreshToken: 'revoked-refresh-token',
    });
    const logoutSpy = vi.fn();
    const unsubscribe = tokenStore.subscribeToLogout(logoutSpy);

    mswServer.use(
      http.post(api('/api/v1/auth/refresh'), () =>
        HttpResponse.json(
          { status: 401, title: 'Auth.RefreshRevoked', detail: 'Token reused' },
          { status: 401 },
        ),
      ),
      http.get(api('/api/v1/protected'), () =>
        HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(httpClient.get('/api/v1/protected')).rejects.toBeInstanceOf(ApiError);
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
    expect(logoutSpy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('parses RFC 9457 ProblemDetails and exposes status helpers and traceId', async () => {
    mswServer.use(
      http.put(api('/api/v1/companies/123'), () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Concurrency.Conflict',
            detail: 'La fiche a été modifiée par un autre utilisateur.',
            traceId: 'trace-xyz-99',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );

    try {
      await httpClient.put('/api/v1/companies/123', {});
      expect.unreachable('Expected ApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(409);
      expect(apiError.isConflict).toBe(true);
      expect(apiError.code).toBe('Concurrency.Conflict');
      expect(apiError.detail).toBe('La fiche a été modifiée par un autre utilisateur.');
      expect(apiError.traceId).toBe('trace-xyz-99');
    }
  });
});
