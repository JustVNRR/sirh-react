import type { CommonDocumentCategory } from '../types/internalLifeTypes';

export const ALL_COMMON_DOCUMENT_CATEGORIES: readonly CommonDocumentCategory[] = [
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
];

export const CSE_DOCUMENT_CATEGORIES: readonly CommonDocumentCategory[] = [
  'csePv',
  'cseBde',
  'harassmentBestPractices',
];

export const WELCOME_KIT_CATEGORIES: readonly CommonDocumentCategory[] = [
  'welcomeKitMutual',
  'welcomeKitForesight',
  'welcomeKitEmergencyContact',
  'welcomeKitLuncheonVoucher',
  'welcomeKitBooklet',
  'welcomeKitMobility',
];

export const COMMON_DOCUMENT_CATEGORY_LABELS: Record<CommonDocumentCategory, string> = {
  rseReport: 'Rapport RSE',
  rseInvestigation: 'Enquête RSE',
  csePv: 'PV du CSE',
  cseBde: 'Activités CSE / BDE',
  harassmentBestPractices: 'Bonnes pratiques anti-harcèlement',
  companyAgreements: 'Accords d’entreprise',
  collectiveAgreement: 'Convention collective',
  recruitmentCv: 'Recrutement — CV',
  recruitmentHrInterview: 'Recrutement — Entretien RH',
  recruitmentTechnicalTests: 'Recrutement — Tests techniques',
  recruitmentTechnicalAudit: 'Recrutement — Audit technique',
  recruitmentManagerInterview: 'Recrutement — Entretien manager',
  welcomeKitMutual: 'Kit accueil — Mutuelle',
  welcomeKitForesight: 'Kit accueil — Prévoyance',
  welcomeKitEmergencyContact: 'Kit accueil — Contacts d’urgence',
  welcomeKitLuncheonVoucher: 'Kit accueil — Titres restaurant',
  welcomeKitBooklet: 'Kit accueil — Livret d’accueil',
  welcomeKitMobility: 'Kit accueil — Mobilité',
  otherCommonDocument: 'Autre document commun',
};

export function isCseCategory(category: CommonDocumentCategory): boolean {
  return CSE_DOCUMENT_CATEGORIES.includes(category);
}

export function isWelcomeKitCategory(category: CommonDocumentCategory): boolean {
  return WELCOME_KIT_CATEGORIES.includes(category);
}

export interface CommonDocumentWriteRights {
  canWriteAll: boolean;
  canWriteCse: boolean;
  canWriteWelcomeKits: boolean;
}

export function canWriteCommonDocumentCategory(
  category: CommonDocumentCategory,
  rights: CommonDocumentWriteRights,
): boolean {
  if (rights.canWriteAll) {
    return true;
  }
  if (rights.canWriteCse && isCseCategory(category)) {
    return true;
  }
  if (rights.canWriteWelcomeKits && isWelcomeKitCategory(category)) {
    return true;
  }
  return false;
}

export function getWritableCommonCategories(
  rights: CommonDocumentWriteRights & { welcomeKitOnly?: boolean },
): CommonDocumentCategory[] {
  const pool = rights.welcomeKitOnly ? WELCOME_KIT_CATEGORIES : ALL_COMMON_DOCUMENT_CATEGORIES;
  return pool.filter((category) => canWriteCommonDocumentCategory(category, rights));
}
