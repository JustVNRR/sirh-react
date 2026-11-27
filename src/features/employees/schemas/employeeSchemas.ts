import { z } from 'zod';
import { ROLES } from '@/shared/auth/permissions';

export const HONORIFIC_VALUES = ['M', 'Mme', 'Autre'] as const;
export const PRIVILEGED_ROLES: readonly string[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 10 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

const baseEmployeeFields = {
  companyId: z.string().min(1, "L'entreprise est requise."),
  directManagerId: z.string(),
  honorific: z.enum(HONORIFIC_VALUES, { error: 'La civilité est requise.' }),
  firstName: z.string().trim().min(1, 'Le prénom est requis.').max(100, 'Maximum 100 caractères.'),
  lastName: z.string().trim().min(1, 'Le nom est requis.').max(100, 'Maximum 100 caractères.'),
  roleCodes: z.array(z.string()).min(1, 'Sélectionnez au moins un rôle.'),
  bornAt: z.string(),
  birthPlace: z.string().trim().max(120, 'Maximum 120 caractères.'),
  birthDepartmentCode: z.string().trim().max(10, 'Maximum 10 caractères.'),
  nationalId: z.string().trim().max(30, 'Maximum 30 caractères.'),
  landline: z.string().trim().max(30, 'Maximum 30 caractères.'),
  mobile: z.string().trim().max(30, 'Maximum 30 caractères.'),
  personalEmail: z
    .string()
    .trim()
    .max(256, 'Maximum 256 caractères.')
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      'Email personnel invalide.',
    ),
  personalLandline: z.string().trim().max(30, 'Maximum 30 caractères.'),
  personalMobile: z.string().trim().max(30, 'Maximum 30 caractères.'),
  street: z.string().trim().max(200),
  postalCode: z.string().trim().max(20),
  city: z.string().trim().max(100),
  additionalInfo: z.string().trim().max(200),
  departments: z.array(z.string()),
};

export const createEmployeeSchema = z.object({
  ...baseEmployeeFields,
  password: z
    .string()
    .refine(
      isStrongPassword,
      'Le mot de passe doit contenir ≥ 10 caractères, majuscule, minuscule, chiffre et caractère spécial.',
    ),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object(baseEmployeeFields);

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;
