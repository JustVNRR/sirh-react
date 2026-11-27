import { formatDateFr } from '@/shared/lib/format';
import type { BadgeProps } from '@/shared/ui';
import type {
  EmployeeDocumentCategory,
  EmployeeDocumentType,
} from '../types/employeeDocumentTypes';

export const ALL_DOCUMENT_CATEGORIES: readonly EmployeeDocumentCategory[] = [
  'personalFile',
  'personalEvents',
  'contractualElements',
  'disciplinary',
  'departure',
  'integration',
];

export const CATEGORY_LABELS: Record<EmployeeDocumentCategory, string> = {
  personalFile: 'Dossier personnel',
  personalEvents: 'Événements personnels',
  contractualElements: 'Éléments contractuels',
  disciplinary: 'Disciplinaire',
  departure: 'Départ',
  integration: 'Intégration',
};

export const DOCUMENT_TYPES_BY_CATEGORY: Record<
  EmployeeDocumentCategory,
  readonly EmployeeDocumentType[]
> = {
  personalFile: [
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
  ],
  personalEvents: [
    'familyEventLeave',
    'maternityLeave',
    'paternityLeave',
    'parentalLeave',
    'trainingLeave',
    'birthLeave',
    'otherPersonalEvent',
  ],
  contractualElements: ['contractElements', 'amendment', 'annex', 'otherContractualElement'],
  disciplinary: [
    'formalNotice',
    'warning',
    'blame',
    'preliminaryInterviewInvitation',
    'disciplinarySuspension',
    'downgrading',
    'dismissal',
    'otherDisciplinary',
  ],
  departure: [
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
  ],
  integration: ['integrationFile'],
};

export const DOCUMENT_TYPE_LABELS: Record<EmployeeDocumentType, string> = {
  cv: 'CV',
  vitalCard: 'Carte Vitale',
  nationalIdCard: 'Carte nationale d’identité',
  socialSecurityCertificate: 'Attestation Sécurité sociale',
  passport: 'Passeport',
  residentPermit: 'Titre de séjour',
  iban: 'RIB / IBAN',
  rqthCertificate: 'Attestation RQTH',
  mutualAdhesionDia: 'Mutuelle — Adhésion DIA',
  mutualAdhesionBia: 'Mutuelle — Adhésion BIA',
  exemptionForm: 'Dispense mutuelle',
  sepaMandate: 'Mandat SEPA',
  providentBulletin: 'Bulletin de prévoyance',
  emergencyContactSheet: 'Fiche contacts d’urgence',
  familyEventLeave: 'Congé événement familial',
  maternityLeave: 'Congé maternité',
  paternityLeave: 'Congé paternité',
  parentalLeave: 'Congé parental',
  trainingLeave: 'Congé formation',
  birthLeave: 'Congé naissance',
  otherPersonalEvent: 'Autre événement personnel',
  contractElements: 'Éléments contractuels',
  amendment: 'Avenant',
  annex: 'Annexe',
  otherContractualElement: 'Autre élément contractuel',
  formalNotice: 'Mise en demeure',
  warning: 'Avertissement',
  blame: 'Blâme',
  preliminaryInterviewInvitation: 'Convocation entretien préalable',
  disciplinarySuspension: 'Mise à pied disciplinaire',
  downgrading: 'Rétrogradation',
  dismissal: 'Licenciement',
  otherDisciplinary: 'Autre pièce disciplinaire',
  resignationLetter: 'Lettre de démission',
  departureInterviewNotice: 'Convocation entretien départ',
  departureInterviewDocument: 'Compte-rendu entretien départ',
  mutualBreachAgreement: 'Convention rupture conventionnelle',
  invitationRc: 'Invitation rupture conventionnelle',
  cerfaRc: 'CERFA rupture conventionnelle',
  notificationRc: 'Notification rupture conventionnelle',
  departureNotification: 'Notification de départ',
  dismissalNotification: 'Notification de licenciement',
  otherDeparture: 'Autre pièce de départ',
  integrationFile: 'Dossier d’intégration',
};

export function isSensitiveCategory(category: EmployeeDocumentCategory): boolean {
  return category === 'disciplinary' || category === 'departure';
}

export function isSelfServiceWritableCategory(category: EmployeeDocumentCategory): boolean {
  return category === 'personalFile' || category === 'personalEvents';
}

export function getVisibleCategories(canReadSensitive: boolean): EmployeeDocumentCategory[] {
  return ALL_DOCUMENT_CATEGORIES.filter(
    (category) => canReadSensitive || !isSensitiveCategory(category),
  );
}

export function getWritableCategories(
  canWriteAll: boolean,
  canWriteSelf: boolean,
): EmployeeDocumentCategory[] {
  if (canWriteAll) {
    return [...ALL_DOCUMENT_CATEGORIES];
  }
  if (canWriteSelf) {
    return ALL_DOCUMENT_CATEGORIES.filter(isSelfServiceWritableCategory);
  }
  return [];
}

export interface ExpiryAlertStatus {
  status: 'expired' | 'critical' | 'warning' | 'valid';
  daysRemaining: number;
  label: string;
  variant: BadgeProps['variant'];
}

export function getExpiryAlertStatus(expiryDate: string, now = new Date()): ExpiryAlertStatus {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const parts = expiryDate.split('-').map(Number);
  const year = parts[0] ?? now.getUTCFullYear();
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;
  const targetUtc = Date.UTC(year, month, day);
  const daysRemaining = Math.round((targetUtc - todayUtc) / 86_400_000);

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      label: `Expiré (${formatDateFr(expiryDate)})`,
      variant: 'danger',
    };
  }
  if (daysRemaining <= 7) {
    return {
      status: 'critical',
      daysRemaining,
      label: `Expire dans ${daysRemaining} j`,
      variant: 'danger',
    };
  }
  if (daysRemaining <= 30) {
    return {
      status: 'warning',
      daysRemaining,
      label: `Expire dans ${daysRemaining} j`,
      variant: 'warning',
    };
  }
  return {
    status: 'valid',
    daysRemaining,
    label: `Valide jusqu'au ${formatDateFr(expiryDate)}`,
    variant: 'success',
  };
}
