export type StaffRepresentativeRole = 'titularDelegate' | 'alternateDelegate' | 'unionDelegate';

export type ElectoralCollege = 'workersEmployees' | 'techniciansSupervisors' | 'executives';

export interface StaffRepresentativeDto {
  id: string;
  companyId: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  representativeRole: StaffRepresentativeRole;
  college: ElectoralCollege;
  isHarassmentAdvisor: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface StaffRepresentativesFilter {
  companyId?: string;
  role?: StaffRepresentativeRole;
  harassmentAdvisor?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateStaffRepresentativeRequest {
  companyId: string;
  employeeId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  representativeRole: StaffRepresentativeRole;
  college: ElectoralCollege;
  isHarassmentAdvisor: boolean;
}

export interface UpdateStaffRepresentativeRequest extends CreateStaffRepresentativeRequest {
  rowVersion?: string | null;
}

export type RseIdeaStatus = 'submitted' | 'inReview' | 'treated' | 'rejected';

export interface RseIdeaDto {
  id: string;
  authorEmployeeId: string;
  locationId: string | null;
  title: string;
  ideaContent: string;
  hasAttachment: boolean;
  attachmentFileName: string | null;
  attachmentContentType: string | null;
  attachmentFileSizeBytes: number | null;
  status: RseIdeaStatus;
  rhComment: string | null;
  treatedByEmployeeId: string | null;
  treatedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface RseIdeasFilter {
  locationId?: string;
  status?: RseIdeaStatus;
  authorId?: string;
  mineOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TreatRseIdeaRequest {
  status: RseIdeaStatus;
  rhComment?: string | null;
  rowVersion?: string | null;
}
