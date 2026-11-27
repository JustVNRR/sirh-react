import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { triggerBlobDownload } from '@/shared/lib/file';
import { Button } from './Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog';

export interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blob: Blob | null;
  fileName: string;
  title?: string;
}

export function PdfPreviewModal({
  open,
  onOpenChange,
  blob,
  fileName,
  title = 'Aperçu du document',
}: PdfPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !blob) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, blob]);

  const isImage = blob?.type.startsWith('image/') ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate">{title}</DialogTitle>
            {blob && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerBlobDownload(blob, fileName)}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Télécharger
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="mt-4 h-[70vh] w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
          {objectUrl && isImage && (
            <img src={objectUrl} alt={fileName} className="h-full w-full object-contain" />
          )}
          {objectUrl && !isImage && (
            <iframe src={objectUrl} title={fileName} className="h-full w-full border-0" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
