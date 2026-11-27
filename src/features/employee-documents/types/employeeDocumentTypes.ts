export type EmployeeDocumentCategory =
  | 'personalFile'
  | 'personalEvents'
  | 'contractualElements'
  | 'disciplinary'
  | 'departure'
  | 'integration';

export type EmployeeDocumentType =
  // PersonalFile
  | 'cv'
  | 'vitalCard'
  | 'nationalIdCard'
  | 'socialSecurityCertificate'
  | 'passport'
  | 'residentPermit'
  | 'iban'
  | 'rqthCertificate'
  | 'mutualAdhesionDia'
  | 'mutualAdhesionBia'
  | 'exemptionForm'
  | 'sepaMandate'
  | 'providentBulletin'
  | 'emergencyContactSheet'
  // PersonalEvents
  | 'familyEventLeave'
  | 'maternityLeave'
  | 'paternityLeave'
  | 'parentalLeave'
  | 'trainingLeave'
  | 'birthLeave'
  | 'otherPersonalEvent'
  // ContractualElements
  | 'contractElements'
  | 'amendment'
  | 'annex'
  | 'otherContractualElement'
  // Disciplinary
  | 'formalNotice'
  | 'warning'
  | 'blame'
  | 'preliminaryInterviewInvitation'
  | 'disciplinarySuspension'
  | 'downgrading'
  | 'dismissal'
  | 'otherDisciplinary'
  // Departure
  | 'resignationLetter'
  | 'departureInterviewNotice'
  | 'departureInterviewDocument'
  | 'mutualBreachAgreement'
  | 'invitationRc'
  | 'cerfaRc'
  | 'notificationRc'
  | 'departureNotification'
  | 'dismissalNotification'
  | 'otherDeparture'
  // Integration
  | 'integrationFile';

export interface RqthDetailDto {
  expiryDate: string;
  workplaceAccommodation: string | null;
  expiryReminder30SentAtUtc: string | null;
  expiryReminder7SentAtUtc: string | null;
}

export interface ResidentPermitDetailDto {
  permitNumber: string;
  expiryDate: string;
  expiryReminder30SentAtUtc: string | null;
  expiryReminder7SentAtUtc: string | null;
}

export interface EmployeeDocumentDto {
  id: string;
  employeeId: string;
  category: EmployeeDocumentCategory;
  documentType: EmployeeDocumentType;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileDate: string;
  commentary: string | null;
  rqthDetails: RqthDetailDto | null;
  residentPermitDetails: ResidentPermitDetailDto | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface EmployeeDocumentsFilter {
  employeeId?: string;
  category?: EmployeeDocumentCategory;
  documentTypes?: EmployeeDocumentType[];
  search?: string;
  page?: number;
  pageSize?: number;
}
