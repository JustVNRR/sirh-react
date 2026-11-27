const SIRET_LENGTH = 14;
const LA_POSTE_SIREN_PREFIX = '356000000';

export function isValidSiret(siret: string): boolean {
  const trimmed = siret.trim();
  if (trimmed.length !== SIRET_LENGTH) {
    return false;
  }

  let luhnSum = 0;
  let rawSum = 0;

  for (let i = 0; i < SIRET_LENGTH; i += 1) {
    const code = trimmed.charCodeAt(i);
    if (code < 48 || code > 57) {
      return false;
    }

    const digit = code - 48;
    rawSum += digit;

    if (i % 2 === 0) {
      const doubled = digit * 2;
      luhnSum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      luhnSum += digit;
    }
  }

  if (luhnSum % 10 === 0) {
    return true;
  }

  return trimmed.startsWith(LA_POSTE_SIREN_PREFIX) && rawSum % 5 === 0;
}

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
