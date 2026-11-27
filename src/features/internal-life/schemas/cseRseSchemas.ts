import { z } from 'zod';
import type { BadgeProps } from '@/shared/ui';
import type {
  ElectoralCollege,
  RseIdeaStatus,
  StaffRepresentativeRole,
} from '../types/cseRseTypes';

export const STAFF_REP_ROLES = [
  'titularDelegate',
  'alternateDelegate',
  'unionDelegate',
] as const satisfies readonly StaffRepresentativeRole[];

export const STAFF_REP_ROLE_LABELS: Record<StaffRepresentativeRole, string> = {
  titularDelegate: 'Délégué titulaire',
  alternateDelegate: 'Délégué suppléant',
  unionDelegate: 'Délégué syndical',
};

export const ELECTORAL_COLLEGES = [
  'workersEmployees',
  'techniciansSupervisors',
  'executives',
] as const satisfies readonly ElectoralCollege[];

export const ELECTORAL_COLLEGE_LABELS: Record<ElectoralCollege, string> = {
  workersEmployees: 'Ouvriers / Employés',
  techniciansSupervisors: 'Techniciens / Agents de maîtrise',
  executives: 'Cadres',
};

export const RSE_STATUS_VALUES = [
  'submitted',
  'inReview',
  'treated',
  'rejected',
] as const satisfies readonly RseIdeaStatus[];

export const RSE_STATUS_LABELS: Record<RseIdeaStatus, string> = {
  submitted: 'Soumise',
  inReview: 'En cours d’examen',
  treated: 'Traitée',
  rejected: 'Refusée',
};

export const RSE_STATUS_BADGE: Record<RseIdeaStatus, BadgeProps['variant']> = {
  submitted: 'info',
  inReview: 'warning',
  treated: 'success',
  rejected: 'danger',
};

export const staffRepresentativeSchema = z.object({
  companyId: z.string().min(1, 'Sélectionnez une entreprise.'),
  employeeId: z.string().optional().or(z.literal('')),
  firstName: z.string().trim().min(1, 'Le prénom est requis.').max(100),
  lastName: z.string().trim().min(1, 'Le nom est requis.').max(100),
  email: z.string().trim().email('Adresse email invalide.').max(200),
  representativeRole: z.enum(STAFF_REP_ROLES),
  college: z.enum(ELECTORAL_COLLEGES),
  isHarassmentAdvisor: z.boolean(),
});

export type StaffRepresentativeFormValues = z.infer<typeof staffRepresentativeSchema>;

export const rseIdeaSchema = z.object({
  locationId: z.string().optional().or(z.literal('')),
  title: z.string().trim().min(1, 'Le titre est requis.').max(200),
  ideaContent: z.string().trim().min(1, 'Le contenu de l’idée est requis.').max(4000),
});

export type RseIdeaFormValues = z.infer<typeof rseIdeaSchema>;

export const treatRseIdeaSchema = z.object({
  status: z.enum(RSE_STATUS_VALUES),
  rhComment: z
    .string()
    .trim()
    .max(2000, 'Le commentaire RH ne doit pas dépasser 2000 caractères.')
    .optional()
    .or(z.literal('')),
});

export type TreatRseIdeaFormValues = z.infer<typeof treatRseIdeaSchema>;
