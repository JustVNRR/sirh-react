import { z } from 'zod';

export const emergencyContactSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Le nom complet est requis.').max(150),
    relationship: z.string().trim().min(1, 'Le lien de parenté est requis.').max(100),
    priorityOrder: z.number().int().min(1).max(2),
    mobilePhone: z.string().trim().max(30),
    homePhone: z.string().trim().max(30),
    workPhone: z.string().trim().max(30),
  })
  .refine((val) => Boolean(val.mobilePhone || val.homePhone || val.workPhone), {
    path: ['mobilePhone'],
    message: 'Au moins un numéro de téléphone (mobile, domicile ou pro) est requis.',
  });

export type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>;

export function createPositionSchema(employeeId: string) {
  return z
    .object({
      jobTitle: z.string().trim().min(1, "L'intitulé du poste est requis.").max(150),
      startAt: z.string().min(1, 'La date de début est requise.'),
      endAt: z.string(),
      managerId: z.string(),
      locationId: z.string(),
      contractLabel: z.string().trim().max(150),
      coefficient: z.string().trim().max(50),
      rate: z.string(),
      supervisor: z.string().trim().max(150),
      timeContractType: z.enum(['', 'Hours', 'Days']),
      timeContractAmount: z.string(),
      hierarchicalPosition: z.string().trim().max(120),
      departments: z.array(z.string()),
    })
    .refine((val) => !val.endAt || val.endAt >= val.startAt, {
      path: ['endAt'],
      message: 'La date de fin doit être postérieure ou égale à la date de début.',
    })
    .refine((val) => !val.managerId || val.managerId !== employeeId, {
      path: ['managerId'],
      message: 'Un collaborateur ne peut pas être son propre manager.',
    })
    .refine((val) => !val.rate || Number(val.rate) >= 0, {
      path: ['rate'],
      message: 'Le taux / rémunération doit être positif ou nul.',
    })
    .refine((val) => !val.timeContractAmount || Number(val.timeContractAmount) >= 0, {
      path: ['timeContractAmount'],
      message: 'Le volume horaire/jours doit être positif ou nul.',
    });
}

export type PositionFormValues = z.infer<ReturnType<typeof createPositionSchema>>;
