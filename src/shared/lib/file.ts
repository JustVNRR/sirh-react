export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadFile(
  file: File,
  allowedExtensions: readonly string[] = ALLOWED_DOCUMENT_EXTENSIONS,
  maxBytes: number = MAX_FILE_SIZE_BYTES,
): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, error: 'Le fichier sélectionné est vide.' };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Le fichier dépasse la taille maximale autorisée (${formatFileSize(maxBytes)}).`,
    };
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));
  if (!hasAllowedExtension) {
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés : ${allowedExtensions.join(', ')}.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} Ko`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}

export function extractFilenameFromContentDisposition(
  headerValue: string | null,
  fallback = 'document.pdf',
): string {
  if (!headerValue) {
    return fallback;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(headerValue);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(headerValue);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }

  const plainMatch = /filename=([^;]+)/i.exec(headerValue);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return fallback;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
