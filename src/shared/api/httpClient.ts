import { tokenStore } from '@/shared/auth/tokenStore';
import type { AuthTokens } from '@/shared/auth/types';
import { env } from '@/shared/config/env';
import { extractFilenameFromContentDisposition } from '@/shared/lib/file';
import { ApiError, type ProblemDetails } from './types';

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  _retried?: boolean;
}

export interface BlobDownloadResult {
  blob: Blob;
  fileName: string;
  contentType: string;
}

let refreshInFlight: Promise<string | null> | null = null;

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalized}`;
}

async function parseProblemDetails(response: Response): Promise<ProblemDetails> {
  const correlationId = response.headers.get('X-Correlation-Id') ?? undefined;
  const contentType = response.headers.get('Content-Type') ?? '';

  if (contentType.includes('json')) {
    try {
      const json = (await response.json()) as Partial<ProblemDetails>;
      return {
        type: json.type,
        title: json.title,
        status: json.status ?? response.status,
        detail: json.detail,
        instance: json.instance,
        traceId: json.traceId ?? correlationId,
        errors: json.errors,
      };
    } catch {
      // Fallback below
    }
  }

  return {
    status: response.status,
    title: `HTTP_${response.status}`,
    detail: response.statusText || `Erreur HTTP ${response.status}`,
    traceId: correlationId,
  };
}

export async function refreshAccessTokenSingleFlight(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(buildUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        tokenStore.clearTokens(true);
        tokenStore.notifyLogout();
        return null;
      }

      const tokens = (await response.json()) as AuthTokens;
      tokenStore.setTokens(tokens);
      return tokens.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function executeFetch(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  let serializedBody: BodyInit | undefined;
  if (isFormData) {
    serializedBody = body;
  } else if (body !== undefined) {
    serializedBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: serializedBody,
    signal: options.signal,
  });

  if (response.status === 401 && !options.skipAuth && !options._retried) {
    const nextToken = await refreshAccessTokenSingleFlight();
    if (nextToken) {
      return executeFetch(method, path, body, { ...options, _retried: true });
    }
  }

  if (!response.ok) {
    const problem = await parseProblemDetails(response);
    throw new ApiError(problem);
  }

  return response;
}

async function requestJson<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response = await executeFetch(method, path, body, options);
  if (response.status === 204 || response.status === 202) {
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }
  return (await response.json()) as T;
}

async function requestBlob(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<BlobDownloadResult> {
  const response = await executeFetch(method, path, body, options);
  const blob = await response.blob();
  const contentType = response.headers.get('Content-Type') ?? blob.type ?? 'application/pdf';
  const fileName = extractFilenameFromContentDisposition(
    response.headers.get('Content-Disposition'),
    'document.pdf',
  );
  return { blob, fileName, contentType };
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    requestJson<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    requestJson<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    requestJson<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    requestJson<T>('PATCH', path, body, options),
  delete: <T = void>(path: string, options?: RequestOptions) =>
    requestJson<T>('DELETE', path, undefined, options),
  getBlob: (path: string, options?: RequestOptions) => requestBlob('GET', path, undefined, options),
  postBlob: (path: string, body?: unknown, options?: RequestOptions) =>
    requestBlob('POST', path, body, options),
};
