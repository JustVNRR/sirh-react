import { Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from '@/shared/ui';
import {
  useDeleteEmergencyContactMutation,
  useEmergencyContactsQuery,
} from '../hooks/useEmergencyContactsQueries';
import type { EmergencyContactDto } from '../types/employeeTypes';
import { EmergencyContactFormDialog } from './EmergencyContactFormDialog';

const MAX_EMERGENCY_CONTACTS = 2;

export function EmergencyContactsTab({
  employeeId,
  canWrite,
}: {
  employeeId: string;
  canWrite: boolean;
}) {
  const query = useEmergencyContactsQuery(employeeId);
  const deleteMutation = useDeleteEmergencyContactMutation(employeeId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContactDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmergencyContactDto | null>(null);

  if (query.isLoading) {
    return <Spinner label="Chargement des contacts d'urgence..." />;
  }

  if (query.error) {
    return (
      <Alert variant="danger" title="Erreur">
        {query.error instanceof ApiError
          ? query.error.detail
          : "Impossible de charger les contacts d'urgence."}
      </Alert>
    );
  }

  const contacts = [...(query.data ?? [])].sort((a, b) => a.priorityOrder - b.priorityOrder);
  const limitReached = contacts.length >= MAX_EMERGENCY_CONTACTS;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Contact d'urgence supprimé.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : 'Suppression impossible.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Contacts enregistrés : {contacts.length} / {MAX_EMERGENCY_CONTACTS}
          </span>
          {limitReached && <Badge variant="warning">Maximum 2 contacts atteint</Badge>}
        </div>
        {canWrite && (
          <Button
            size="sm"
            disabled={limitReached}
            onClick={() => {
              setSelectedContact(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un contact
          </Button>
        )}
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={<Phone className="h-6 w-6" aria-hidden="true" />}
          title="Aucun contact d'urgence"
          description="Ajoutez jusqu'à 2 personnes à prévenir en cas d'urgence."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--foreground)]">{contact.fullName}</p>
                      <Badge variant="primary">Priorité {contact.priorityOrder}</Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{contact.relationship}</p>
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Modifier ${contact.fullName}`}
                        onClick={() => {
                          setSelectedContact(contact);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Supprimer ${contact.fullName}`}
                        onClick={() => setDeleteTarget(contact)}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm text-[var(--foreground)]">
                  {contact.mobilePhone && <p>Mobile : {contact.mobilePhone}</p>}
                  {contact.homePhone && <p>Domicile : {contact.homePhone}</p>}
                  {contact.workPhone && <p>Pro : {contact.workPhone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmergencyContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employeeId={employeeId}
        contact={selectedContact}
        defaultPriority={contacts.length === 0 ? 1 : 2}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer ${deleteTarget?.fullName ?? ''} ?`}
        description="Ce contact d'urgence sera définitivement supprimé."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
