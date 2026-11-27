import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCompaniesQuery, useDepartmentsQuery } from '@/features/organization';
import { useRolesListQuery } from '@/features/roles';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Badge, Button, DataTable, Input, PageHeader, Select } from '@/shared/ui';
import { useEmployeesQuery } from '../hooks/useEmployeesQueries';
import type { EmployeeSummaryDto } from '../types/employeeTypes';

function parseBoolParam(raw: string | null): boolean | undefined {
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return undefined;
}

export function EmployeesDirectoryPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.EMPLOYEES_WRITE);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const companyId = searchParams.get('companyId') ?? '';
  const department = searchParams.get('department') ?? '';
  const role = searchParams.get('role') ?? '';
  const activeParam = searchParams.get('active') ?? 'all';
  const inPositionParam = searchParams.get('inPosition') ?? 'all';
  const urlSearch = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch === urlSearch) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      next.set('search', debouncedSearch);
    } else {
      next.delete('search');
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, urlSearch, searchParams, setSearchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next, { replace: true });
  };

  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const departmentsQuery = useDepartmentsQuery();
  const rolesQuery = useRolesListQuery();

  const employeesQuery = useEmployeesQuery({
    companyId: companyId || undefined,
    department: department || undefined,
    role: role || undefined,
    active: parseBoolParam(activeParam),
    inPosition: parseBoolParam(inPositionParam),
    search: urlSearch || undefined,
    page,
    pageSize: 20,
  });

  const deptLabelMap = new Map((departmentsQuery.data ?? []).map((d) => [d.code, d.label]));

  const columns: ColumnDef<EmployeeSummaryDto, unknown>[] = [
    {
      accessorKey: 'lastName',
      header: 'Collaborateur',
      cell: ({ row }) => (
        <div>
          <Link
            to={`/employees/${row.original.id}`}
            className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] hover:underline"
          >
            {row.original.honorific} {row.original.firstName} {row.original.lastName}
          </Link>
          <p className="text-xs text-[var(--muted-foreground)]">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'departments',
      header: 'Départements',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.departments.length > 0 ? (
            row.original.departments.map((code) => (
              <Badge key={code} variant="neutral">
                {deptLabelMap.get(code) ?? code}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Rôles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((r) => (
            <Badge key={r} variant="primary">
              {r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.original.isActive ? 'success' : 'danger'}>
            {row.original.isActive ? 'Actif' : 'Désactivé'}
          </Badge>
          {row.original.currentlyInPosition && <Badge variant="info">En poste</Badge>}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link
            to={`/employees/${row.original.id}`}
            aria-label={`Consulter ${row.original.firstName} ${row.original.lastName}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaborateurs"
        description="Annuaire des collaborateurs et accès à leurs fiches 360°."
        actions={
          canWrite && (
            <Button asChild>
              <Link to="/employees/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nouveau collaborateur
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          aria-label="Rechercher un collaborateur"
          placeholder="Nom, prénom, email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="lg:col-span-2"
        />
        <Select
          aria-label="Filtrer par entreprise"
          value={companyId}
          onChange={(e) => updateFilter('companyId', e.target.value)}
        >
          <option value="">Toutes les entreprises</option>
          {companiesQuery.data?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par département"
          value={department}
          onChange={(e) => updateFilter('department', e.target.value)}
        >
          <option value="">Tous les départements</option>
          {departmentsQuery.data?.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par rôle"
          value={role}
          onChange={(e) => updateFilter('role', e.target.value)}
        >
          <option value="">Tous les rôles</option>
          {rolesQuery.data?.map((r) => (
            <option key={r.id} value={r.code}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par statut"
          value={activeParam}
          onChange={(e) => updateFilter('active', e.target.value)}
        >
          <option value="all">Tous statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={employeesQuery.data?.items ?? []}
        page={employeesQuery.data?.page ?? page}
        pageSize={employeesQuery.data?.pageSize ?? 20}
        totalCount={employeesQuery.data?.totalCount ?? 0}
        totalPages={employeesQuery.data?.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={employeesQuery.isLoading}
        errorMessage={
          employeesQuery.error instanceof ApiError ? employeesQuery.error.detail : undefined
        }
        emptyTitle="Aucun collaborateur"
        emptyDescription="Aucun collaborateur ne correspond aux critères sélectionnés."
      />
    </div>
  );
}
