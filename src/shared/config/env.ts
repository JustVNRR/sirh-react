const DEFAULT_API_BASE_URL = 'https://localhost:54235';
const DEFAULT_EDOCPERSO_URL = 'https://www.edocperso.fr/';

function trimTrailingSlashes(value: string): string {
  let result = value;
  while (result.endsWith('/')) {
    result = result.slice(0, -1);
  }
  return result;
}

export const env = {
  apiBaseUrl:
    trimTrailingSlashes((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '') ||
    DEFAULT_API_BASE_URL,
  urssafEnabled: (import.meta.env.VITE_URSSAF_ENABLED as string | undefined) !== 'false',
  edocPersoUrl: (import.meta.env.VITE_EDOCPERSO_URL as string | undefined) || DEFAULT_EDOCPERSO_URL,
} as const;
