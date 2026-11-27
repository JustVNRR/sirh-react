export {
  useCompaniesQuery,
  useDepartmentsQuery,
  useLocationsQuery,
} from './hooks/useOrganizationQueries';
export { CompaniesPage } from './pages/CompaniesPage';
export { ContractTypesPage } from './pages/ContractTypesPage';
export { LocationsPage } from './pages/LocationsPage';
export type {
  CompanyDto,
  ContractTypeDto,
  DepartmentDto,
  LocationDto,
} from './types/organizationTypes';
