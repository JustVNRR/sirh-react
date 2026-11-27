export type CommonDocumentCategory =
  | 'rseReport'
  | 'rseInvestigation'
  | 'csePv'
  | 'cseBde'
  | 'harassmentBestPractices'
  | 'companyAgreements'
  | 'collectiveAgreement'
  | 'recruitmentCv'
  | 'recruitmentHrInterview'
  | 'recruitmentTechnicalTests'
  | 'recruitmentTechnicalAudit'
  | 'recruitmentManagerInterview'
  | 'welcomeKitMutual'
  | 'welcomeKitForesight'
  | 'welcomeKitEmergencyContact'
  | 'welcomeKitLuncheonVoucher'
  | 'welcomeKitBooklet'
  | 'welcomeKitMobility'
  | 'otherCommonDocument';

export interface CommonDocumentDto {
  id: string;
  companyId: string | null;
  contractTypeId: string | null;
  category: CommonDocumentCategory;
  isWelcomeKit: boolean;
  title: string;
  description: string | null;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileDate: string;
  isArchived: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CommonDocumentsFilter {
  companyId?: string;
  category?: CommonDocumentCategory;
  isWelcomeKit?: boolean;
  contractTypeId?: string;
  archived?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}
