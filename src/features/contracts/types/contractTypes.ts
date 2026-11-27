export type ContractStatus = 'draft' | 'pendingSignature' | 'signed' | 'archived';

export interface TemplateVariableDto {
  key: string;
  category: string;
  description: string;
}

export interface ContractModelDto {
  id: string;
  title: string;
  description: string | null;
  contractTypeId: string | null;
  templateContent: string;
  customVariables: string[];
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface CreateContractModelRequest {
  title: string;
  description?: string | null;
  contractTypeId?: string | null;
  templateContent: string;
  customVariables?: string[];
  isActive?: boolean;
}

export interface UpdateContractModelRequest extends CreateContractModelRequest {
  rowVersion?: string | null;
}

export interface ContractModelsFilter {
  active?: boolean;
  contractTypeId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PreviewContractRequest {
  positionId: string;
  customVariables?: Record<string, string>;
}

export interface GenerateContractRequest {
  contractModelId: string;
  positionId: string;
  contractTypeId: string;
  customVariables?: Record<string, string>;
  commentary?: string | null;
}

export interface ContractDto {
  id: string;
  positionId: string;
  employeeId: string;
  contractTypeId: string;
  contractModelId: string | null;
  status: ContractStatus;
  signedAt: string | null;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileDate: string;
  commentary: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface ContractsFilter {
  employeeId?: string;
  status?: ContractStatus;
  contractTypeId?: string;
  page?: number;
  pageSize?: number;
}

export interface JobSheetDto {
  id: string;
  positionId: string;
  employeeId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileDate: string;
  commentary: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}
