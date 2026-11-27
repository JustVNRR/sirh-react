export type MedicalVisitType =
  | 'hiring'
  | 'followUp'
  | 'preReturnToWork'
  | 'returnToWork'
  | 'employerRequested'
  | 'employeeRequested';

export interface MedicalVisitDto {
  id: string;
  employeeId: string;
  visitType: MedicalVisitType;
  visitDateTimeUtc: string;
  validityDate: string | null;
  medicalCenter: string | null;
  carriedOut: boolean;
  comments: string | null;
  convocationFileName: string;
  convocationContentType: string;
  convocationFileSizeBytes: number;
  hasReport: boolean;
  reportFileName: string | null;
  reportContentType: string | null;
  reportFileSizeBytes: number | null;
  reminderSentAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface MedicalVisitsFilter {
  employeeId?: string;
  visitType?: MedicalVisitType;
  fromDate?: string;
  toDate?: string;
  carriedOut?: boolean;
  page?: number;
  pageSize?: number;
}
