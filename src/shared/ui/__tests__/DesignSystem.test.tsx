import type { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, FileDropzone, PasswordInput, PdfPreviewModal } from '@/shared/ui';

describe('Design System Components', () => {
  it('toggles password visibility in PasswordInput', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Mot de passe" />);

    const input = screen.getByLabelText('Mot de passe');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('validates file size and extension in FileDropzone', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFileChange = vi.fn();
    render(<FileDropzone id="doc-upload" file={null} onFileChange={onFileChange} />);

    const input = screen.getByLabelText('Sélectionner ou déposer un fichier');
    const invalidFile = new File(['hello'], 'script.exe', { type: 'application/octet-stream' });
    await user.upload(input, invalidFile);

    expect(onFileChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent('Format non supporté');

    const validFile = new File(['%PDF-1.4'], 'contrat.pdf', { type: 'application/pdf' });
    await user.upload(input, validFile);
    expect(onFileChange).toHaveBeenCalledWith(validFile);
  });

  it('creates and revokes ObjectURL in PdfPreviewModal', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-123');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

    const { rerender, unmount } = render(
      <PdfPreviewModal open={true} onOpenChange={vi.fn()} blob={blob} fileName="contrat.pdf" />,
    );

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(screen.getByTitle('contrat.pdf')).toHaveAttribute('src', 'blob:test-123');

    rerender(
      <PdfPreviewModal open={false} onOpenChange={vi.fn()} blob={blob} fileName="contrat.pdf" />,
    );
    expect(revokeSpy).toHaveBeenCalledWith('blob:test-123');

    unmount();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('renders DataTable loading, empty, and paginated states', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const columns: ColumnDef<{ id: string; name: string }, unknown>[] = [
      { accessorKey: 'name', header: 'Nom' },
    ];

    const { rerender } = render(
      <DataTable
        columns={columns}
        data={[]}
        page={1}
        pageSize={20}
        totalCount={0}
        totalPages={0}
        onPageChange={onPageChange}
        isLoading={true}
      />,
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    rerender(
      <DataTable
        columns={columns}
        data={[]}
        page={1}
        pageSize={20}
        totalCount={0}
        totalPages={0}
        onPageChange={onPageChange}
        emptyTitle="Rien ici"
      />,
    );
    expect(screen.getByText('Rien ici')).toBeInTheDocument();

    rerender(
      <DataTable
        columns={columns}
        data={[{ id: '1', name: 'Nova Conseil' }]}
        page={1}
        pageSize={20}
        totalCount={25}
        totalPages={2}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('Nova Conseil')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
