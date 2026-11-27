import { z } from 'zod';
import { ALL_DOCUMENT_CATEGORIES } from '../constants/taxonomy';
import type { EmployeeDocumentType } from '../types/employeeDocumentTypes';

const ALL_TYPES = [
  'cv',
  'vitalCard',
  'nationalIdCard',
  'socialSecurityCertificate',
  'passport',
  'residentPermit',
  'iban',
  'rqthCertificate',
  'mutualAdhesionDia',
  'mutualAdhesionBia',
  'exemptionForm',
  'sepaMandate',
  'providentBulletin',
  'emergencyContactSheet',
  'familyEventLeave',
  'maternityLeave',
  'paternityLeave',
  'parentalLeave',
  'trainingLeave',
  'birthLeave',
  'otherPersonalEvent',
  'contractElements',
  'amendment',
  'annex',
  'otherContractualElement',
  'formalNotice',
  'warning',
  'blame',
  'preliminaryInterviewInvitation',
  'disciplinarySuspension',
  'downgrading',
  'dismissal',
  'otherDisciplinary',
  'resignationLetter',
  'departureInterviewNotice',
  'departureInterviewDocument',
  'mutualBreachAgreement',
  'invitationRc',
  'cerfaRc',
  'notificationRc',
  'departureNotification',
  'dismissalNotification',
  'otherDeparture',
  'integrationFile',
] as const satisfies readonly EmployeeDocumentType[];

export const employeeDocumentSchema = z
  .object({
    employeeId: z.string().optional().or(z.literal('')),
    category: z.enum(
      ALL_DOCUMENT_CATEGORIES as [
        'personalFile',
        'personalEvents',
        'contractualElements',
        'disciplinary',
        'departure',
        'integration',
      ],
    ),
    documentType: z.enum(ALL_TYPES),
    fileDate: z.string().optional().or(z.literal('')),
    commentary: z
      .string()
      .trim()
      .max(1000, 'Le commentaire ne doit pas dépasser 1000 caractères.')
      .optional()
      .or(z.literal('')),
    expiryDate: z.string().optional().or(z.literal('')),
    workplaceAccommodation: z
      .string()
      .trim()
      .max(500, 'L’aménagement de poste ne doit pas dépasser 500 caractères.')
      .optional()
      .or(z.literal('')),
    permitNumber: z
      .string()
      .trim()
      .max(100, 'Le numéro de titre ne doit pas dépasser 100 caractères.')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.documentType === 'rqthCertificate' && !data.expiryDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'La date d’expiration RQTH est requise.',
      });
    }
    if (data.documentType === 'residentPermit') {
      if (!data.permitNumber?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['permitNumber'],
          message: 'Le numéro de titre de séjour est requis.',
        });
      }
      if (!data.expiryDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['expiryDate'],
          message: 'La date d’expiration du titre de séjour est requise.',
        });
      }
    }
  });

export type EmployeeDocumentFormValues = z.infer<typeof employeeDocumentSchema>;
