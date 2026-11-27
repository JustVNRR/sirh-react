import { z } from 'zod';
import { isValidHttpUrl, isValidSiret } from '@/shared/lib/siret';

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'La raison sociale est requise.')
    .max(150, 'Maximum 150 caractères.'),
  legalForm: z.string().trim().max(80, 'Maximum 80 caractères.'),
  address: z.string().trim().min(1, "L'adresse est requise.").max(250, 'Maximum 250 caractères.'),
  postalCode: z.string().trim().max(20, 'Maximum 20 caractères.'),
  city: z.string().trim().max(100, 'Maximum 100 caractères.'),
  country: z.string().trim().max(100, 'Maximum 100 caractères.'),
  siret: z
    .string()
    .trim()
    .refine(isValidSiret, 'Le SIRET doit être un numéro français valide à 14 chiffres.'),
  register: z.string().trim().max(120, 'Maximum 120 caractères.'),
  capital: z.string().trim().max(100, 'Maximum 100 caractères.'),
  collectiveAgreement: z.string().trim().max(150, 'Maximum 150 caractères.'),
  owner: z.string().trim().max(150, 'Maximum 150 caractères.'),
  logoUrl: z
    .string()
    .trim()
    .max(500, 'Maximum 500 caractères.')
    .refine(isValidHttpUrl, "L'URL du logo doit être une URL http ou https valide."),
  isActive: z.boolean(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const locationSchema = z.object({
  name: z.string().trim().min(1, 'Le nom du lieu est requis.').max(150, 'Maximum 150 caractères.'),
  address: z.string().trim().min(1, "L'adresse est requise.").max(250, 'Maximum 250 caractères.'),
  postalCode: z.string().trim().max(20, 'Maximum 20 caractères.'),
  city: z.string().trim().min(1, 'La ville est requise.').max(100, 'Maximum 100 caractères.'),
  country: z.string().trim().max(100, 'Maximum 100 caractères.'),
  departmentCode: z.string().trim().max(10, 'Maximum 10 caractères.'),
  siret: z
    .string()
    .trim()
    .refine(
      (val) => !val || isValidSiret(val),
      'Le SIRET doit être un numéro français valide à 14 chiffres.',
    ),
  colorCode: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'La couleur doit être au format hexadécimal #RRGGBB.'),
  isPublished: z.boolean(),
  companyId: z.string(),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

export const contractTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Le code est requis.')
    .max(50, 'Maximum 50 caractères.')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Le code ne peut contenir que des lettres, chiffres, tirets et underscores.',
    ),
  label: z.string().trim().min(1, 'Le libellé est requis.').max(150, 'Maximum 150 caractères.'),
  isActive: z.boolean(),
});

export type ContractTypeFormValues = z.infer<typeof contractTypeSchema>;
