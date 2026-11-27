import { z } from 'zod';
import { ALL_COMMON_DOCUMENT_CATEGORIES } from '../constants/commonDocumentTaxonomy';

export const commonDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre du document est requis.')
    .max(200, 'Le titre ne doit pas dépasser 200 caractères.'),
  category: z.enum(
    ALL_COMMON_DOCUMENT_CATEGORIES as [
      'rseReport',
      'rseInvestigation',
      'csePv',
      'cseBde',
      'harassmentBestPractices',
      'companyAgreements',
      'collectiveAgreement',
      'recruitmentCv',
      'recruitmentHrInterview',
      'recruitmentTechnicalTests',
      'recruitmentTechnicalAudit',
      'recruitmentManagerInterview',
      'welcomeKitMutual',
      'welcomeKitForesight',
      'welcomeKitEmergencyContact',
      'welcomeKitLuncheonVoucher',
      'welcomeKitBooklet',
      'welcomeKitMobility',
      'otherCommonDocument',
    ],
  ),
  companyId: z.string().optional().or(z.literal('')),
  contractTypeId: z.string().optional().or(z.literal('')),
  isWelcomeKit: z.boolean(),
  description: z
    .string()
    .trim()
    .max(1000, 'La description ne doit pas dépasser 1000 caractères.')
    .optional()
    .or(z.literal('')),
  fileDate: z.string().optional().or(z.literal('')),
});

export type CommonDocumentFormValues = z.infer<typeof commonDocumentSchema>;
