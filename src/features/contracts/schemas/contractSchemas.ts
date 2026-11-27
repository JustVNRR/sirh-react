import { z } from 'zod';
import type { BadgeProps } from '@/shared/ui';
import type { ContractStatus } from '../types/contractTypes';

export const CONTRACT_STATUS_VALUES = ['draft', 'pendingSignature', 'signed', 'archived'] as const;

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Brouillon',
  pendingSignature: 'En attente de signature',
  signed: 'Signé',
  archived: 'Archivé',
};

export const CONTRACT_STATUS_BADGE_VARIANT: Record<ContractStatus, BadgeProps['variant']> = {
  draft: 'neutral',
  pendingSignature: 'warning',
  signed: 'success',
  archived: 'info',
};

export const contractModelSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre du modèle est requis.')
    .max(150, 'Le titre ne doit pas dépasser 150 caractères.'),
  description: z
    .string()
    .trim()
    .max(500, 'La description ne doit pas dépasser 500 caractères.')
    .optional()
    .or(z.literal('')),
  contractTypeId: z.string().optional().or(z.literal('')),
  templateContent: z.string().trim().min(1, 'Le contenu du modèle Markdown/Scriban est requis.'),
  isActive: z.boolean(),
});

export type ContractModelFormValues = z.infer<typeof contractModelSchema>;

export const generateContractSchema = z.object({
  contractModelId: z.string().min(1, 'Sélectionnez un modèle de contrat.'),
  positionId: z.string().min(1, 'Sélectionnez un poste.'),
  contractTypeId: z.string().min(1, 'Sélectionnez un type de contrat.'),
  commentary: z
    .string()
    .trim()
    .max(1000, 'Le commentaire ne doit pas dépasser 1000 caractères.')
    .optional()
    .or(z.literal('')),
});

export type GenerateContractFormValues = z.infer<typeof generateContractSchema>;

export const importContractSchema = z.object({
  positionId: z.string().min(1, 'Sélectionnez un poste.'),
  contractTypeId: z.string().min(1, 'Sélectionnez un type de contrat.'),
  status: z.enum(CONTRACT_STATUS_VALUES),
  signedAt: z.string().optional().or(z.literal('')),
  commentary: z
    .string()
    .trim()
    .max(1000, 'Le commentaire ne doit pas dépasser 1000 caractères.')
    .optional()
    .or(z.literal('')),
});

export type ImportContractFormValues = z.infer<typeof importContractSchema>;

export const editContractSchema = z.object({
  contractTypeId: z.string().min(1, 'Sélectionnez un type de contrat.'),
  status: z.enum(CONTRACT_STATUS_VALUES),
  signedAt: z.string().optional().or(z.literal('')),
  commentary: z
    .string()
    .trim()
    .max(1000, 'Le commentaire ne doit pas dépasser 1000 caractères.')
    .optional()
    .or(z.literal('')),
});

export type EditContractFormValues = z.infer<typeof editContractSchema>;

export const jobSheetSchema = z.object({
  commentary: z
    .string()
    .trim()
    .max(1000, 'Le commentaire ne doit pas dépasser 1000 caractères.')
    .optional()
    .or(z.literal('')),
});

export type JobSheetFormValues = z.infer<typeof jobSheetSchema>;
