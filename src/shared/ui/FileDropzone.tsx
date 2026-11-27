import { FileUp, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  validateUploadFile,
} from '@/shared/lib/file';

export interface FileDropzoneProps {
  id: string;
  label?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  allowedExtensions?: readonly string[];
  maxBytes?: number;
  error?: string;
}

export function FileDropzone({
  id,
  label = 'Sélectionner ou déposer un fichier',
  file,
  onFileChange,
  allowedExtensions = ALLOWED_DOCUMENT_EXTENSIONS,
  maxBytes = MAX_FILE_SIZE_BYTES,
  error,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  const displayedError = error ?? localError;

  const handleCandidate = (candidate: File | undefined) => {
    if (!candidate) {
      return;
    }
    const check = validateUploadFile(candidate, allowedExtensions, maxBytes);
    if (!check.valid) {
      setLocalError(check.error);
      onFileChange(null);
      return;
    }
    setLocalError(undefined);
    onFileChange(candidate);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleCandidate(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleCandidate(event.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          isDragging
            ? 'border-[var(--primary)] bg-indigo-50/40 dark:bg-indigo-950/20'
            : 'border-[var(--border)] bg-[var(--surface)]',
          displayedError && 'border-[var(--danger)]',
        )}
      >
        <FileUp className="mb-2 h-6 w-6 text-[var(--muted-foreground)]" aria-hidden="true" />
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {label}
        </label>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={allowedExtensions.join(',')}
          onChange={handleInputChange}
          className="sr-only"
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Formats : {allowedExtensions.join(', ')} — max {formatFileSize(maxBytes)}
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm">
          <span className="truncate font-medium text-[var(--foreground)]">
            {file.name} ({formatFileSize(file.size)})
          </span>
          <button
            type="button"
            aria-label="Retirer le fichier"
            onClick={() => {
              onFileChange(null);
              if (inputRef.current) {
                inputRef.current.value = '';
              }
            }}
            className="ml-2 rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {displayedError && (
        <p role="alert" className="text-xs font-medium text-[var(--danger)]">
          {displayedError}
        </p>
      )}
    </div>
  );
}
