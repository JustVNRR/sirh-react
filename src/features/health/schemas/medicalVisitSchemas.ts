import { z } from 'zod';
import type { MedicalVisitType } from '../types/medicalVisitTypes';

export const MEDICAL_VISIT_TYPES = [
  'hiring',
  'followUp',
  'preReturnToWork',
  'returnToWork',
  'employerRequested',
  'employeeRequested',
] as const satisfies readonly MedicalVisitType[];

export const MEDICAL_VISIT_TYPE_LABELS: Record<MedicalVisitType, string> = {
  hiring: "Visite d'embauche (VIP)",
  followUp: 'Visite périodique / suivi',
  preReturnToWork: 'Visite de pré-reprise',
  returnToWork: 'Visite de reprise',
  employerRequested: 'À la demande de l’employeur',
  employeeRequested: 'À la demande du salarié',
};

export const medicalVisitCreateSchema = z.object({
  employeeId: z.string().min(1, 'Sélectionnez un collaborateur.'),
  visitType: z.enum(MEDICAL_VISIT_TYPES),
  visitDateTimeLocal: z.string().min(1, 'La date et l’heure de visite sont requises.'),
  validityDate: z.string().optional().or(z.literal('')),
  medicalCenter: z
    .string()
    .trim()
    .max(200, 'Le centre médical ne doit pas dépasser 200 caractères.')
    .optional()
    .or(z.literal('')),
  carriedOut: z.boolean(),
  comments: z
    .string()
    .trim()
    .max(1000, 'Les commentaires ne doivent pas dépasser 1000 caractères.')
    .optional()
    .or(z.literal('')),
});

export const medicalVisitEditSchema = medicalVisitCreateSchema.omit({ employeeId: true });

export type MedicalVisitCreateFormValues = z.infer<typeof medicalVisitCreateSchema>;
export type MedicalVisitEditFormValues = z.infer<typeof medicalVisitEditSchema>;
