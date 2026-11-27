export interface EmployeeAddressDto {
  street: string | null;
  postalCode: string | null;
  city: string | null;
  additionalInfo: string | null;
}

export interface EmployeeSummaryDto {
  id: string;
  userId: string;
  companyId: string;
  directManagerId: string | null;
  slug: string;
  honorific: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string | null;
  departments: string[];
  roles: string[];
  isActive: boolean;
  currentlyInPosition: boolean;
}

export interface EmployeeDetailDto {
  id: string;
  userId: string;
  companyId: string;
  directManagerId: string | null;
  slug: string;
  honorific: string;
  firstName: string;
  lastName: string;
  bornAt: string | null;
  birthPlace: string | null;
  birthDepartmentCode: string | null;
  nationalId: string | null;
  email: string;
  landline: string | null;
  mobile: string | null;
  personalEmail: string | null;
  personalLandline: string | null;
  personalMobile: string | null;
  address: EmployeeAddressDto | null;
  departments: string[];
  roles: string[];
  isActive: boolean;
  currentlyInPosition: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreateEmployeeRequest {
  companyId: string;
  directManagerId: string | null;
  honorific: string;
  firstName: string;
  lastName: string;
  password: string;
  roleCodes: string[];
  bornAt: string | null;
  birthPlace: string | null;
  birthDepartmentCode: string | null;
  nationalId: string | null;
  landline: string | null;
  mobile: string | null;
  personalEmail: string | null;
  personalLandline: string | null;
  personalMobile: string | null;
  address: EmployeeAddressDto | null;
  departments: string[] | null;
}

export interface UpdateEmployeeRequest {
  companyId: string;
  directManagerId: string | null;
  honorific: string;
  firstName: string;
  lastName: string;
  roleCodes: string[] | null;
  bornAt: string | null;
  birthPlace: string | null;
  birthDepartmentCode: string | null;
  nationalId: string | null;
  landline: string | null;
  mobile: string | null;
  personalEmail: string | null;
  personalLandline: string | null;
  personalMobile: string | null;
  address: EmployeeAddressDto | null;
  departments: string[] | null;
  rowVersion: string | null;
}

export interface EmployeeQueryFilter {
  companyId?: string;
  managerId?: string;
  department?: string;
  active?: boolean;
  inPosition?: boolean;
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface EmergencyContactDto {
  id: string;
  employeeId: string;
  fullName: string;
  relationship: string;
  mobilePhone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  priorityOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreateEmergencyContactRequest {
  fullName: string;
  relationship: string;
  mobilePhone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  priorityOrder: number;
}

export interface UpdateEmergencyContactRequest extends CreateEmergencyContactRequest {
  rowVersion: string | null;
}

export interface PositionDto {
  id: string;
  slug: string;
  employeeId: string;
  managerId: string | null;
  locationId: string | null;
  jobTitle: string;
  startAt: string;
  endAt: string | null;
  isCurrent: boolean;
  contractLabel: string | null;
  coefficient: string | null;
  rate: number | null;
  supervisor: string | null;
  timeContractType: string | null;
  timeContractAmount: number | null;
  hierarchicalPosition: string | null;
  departments: string[];
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreatePositionRequest {
  employeeId: string;
  managerId: string | null;
  locationId: string | null;
  jobTitle: string;
  startAt: string;
  endAt: string | null;
  contractLabel: string | null;
  coefficient: string | null;
  rate: number | null;
  supervisor: string | null;
  timeContractType: string | null;
  timeContractAmount: number | null;
  hierarchicalPosition: string | null;
  departments: string[] | null;
}

export interface UpdatePositionRequest {
  managerId: string | null;
  locationId: string | null;
  jobTitle: string;
  startAt: string;
  endAt: string | null;
  contractLabel: string | null;
  coefficient: string | null;
  rate: number | null;
  supervisor: string | null;
  timeContractType: string | null;
  timeContractAmount: number | null;
  hierarchicalPosition: string | null;
  departments: string[] | null;
  rowVersion: string | null;
}
