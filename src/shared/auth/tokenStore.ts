import type { AuthTokens } from './types';

const REFRESH_TOKEN_STORAGE_KEY = 'sirh.refresh_token';
const AUTH_CHANNEL_NAME = 'sirh-auth';

let inMemoryAccessToken: string | null = null;
const logoutListeners = new Set<() => void>();

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  return new BroadcastChannel(AUTH_CHANNEL_NAME);
}

const channel = getBroadcastChannel();
if (channel) {
  channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type === 'LOGOUT') {
      inMemoryAccessToken = null;
      try {
        window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      } catch {
        // Ignore storage failures
      }
      for (const listener of logoutListeners) {
        listener();
      }
    }
  };
}

export const tokenStore = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  getRefreshToken(): string | null {
    try {
      return window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setTokens(tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>): void {
    inMemoryAccessToken = tokens.accessToken;
    try {
      window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
    } catch {
      // Ignore storage failures
    }
  },

  clearTokens(broadcast = false): void {
    inMemoryAccessToken = null;
    try {
      window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage failures
    }
    if (broadcast && channel) {
      channel.postMessage({ type: 'LOGOUT' });
    }
  },

  subscribeToLogout(listener: () => void): () => void {
    logoutListeners.add(listener);
    return () => {
      logoutListeners.delete(listener);
    };
  },

  notifyLogout(): void {
    for (const listener of logoutListeners) {
      listener();
    }
  },
};
