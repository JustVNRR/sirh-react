export interface CompanyDto {
  id: string;
  name: string;
  slug: string;
  legalForm: string | null;
  address: string;
  postalCode: string | null;
  city: string | null;
  country: string;
  siret: string;
  register: string | null;
  capital: string | null;
  collectiveAgreement: string;
  owner: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreateCompanyRequest {
  name: string;
  legalForm: string | null;
  address: string;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  siret: string;
  register: string | null;
  capital: string | null;
  collectiveAgreement: string | null;
  owner: string | null;
  logoUrl: string | null;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  isActive: boolean;
  rowVersion: string | null;
}

export interface UpdateCompanyStatusRequest {
  isActive: boolean;
  rowVersion: string | null;
}

export interface LocationDto {
  id: string;
  slug: string;
  name: string;
  address: string;
  postalCode: string | null;
  city: string;
  country: string;
  departmentCode: string | null;
  siret: string | null;
  colorCode: string;
  isPublished: boolean;
  companyId: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreateLocationRequest {
  name: string;
  address: string;
  postalCode: string | null;
  city: string;
  country: string | null;
  departmentCode: string | null;
  siret: string | null;
  colorCode: string;
  isPublished: boolean;
  companyId: string | null;
}

export interface UpdateLocationRequest extends CreateLocationRequest {
  rowVersion: string | null;
}

export interface ContractTypeDto {
  id: string;
  code: string;
  label: string;
  isSystem: boolean;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreateContractTypeRequest {
  code: string;
  label: string;
  isActive: boolean;
}

export interface UpdateContractTypeRequest extends CreateContractTypeRequest {
  rowVersion: string | null;
}

export interface DepartmentDto {
  code: string;
  label: string;
}
