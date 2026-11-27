import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { useEmployeesQuery } from '@/features/employees';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { formatDateTimeFr } from '@/shared/lib/format';
import { Badge, DataTable, Select } from '@/shared/ui';
import { useQuizAttemptsQuery } from '../hooks/useQuizzesQueries';
import type { QuizAttemptSummaryDto } from '../types/quizTypes';

export function QuizResultsTab({ quizId }: { quizId: string }) {
  const { can } = usePermission();
  const canReadEmployees = can(PERMISSIONS.EMPLOYEES_READ_ALL);

  const [employeeId, setEmployeeId] = useState('');
  const [passedFilter, setPassedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);

  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 }, canReadEmployees);
  const passedParam = passedFilter === 'all' ? undefined : passedFilter === 'true';

  const attemptsQuery = useQuizAttemptsQuery(quizId, {
    employeeId: employeeId || undefined,
    passed: passedParam,
    page,
    pageSize: 20,
  });

  const employeeMap = new Map(
    (employeesQuery.data?.items ?? []).map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
  );

  const columns: ColumnDef<QuizAttemptSummaryDto>[] = [
    {
      id: 'employee',
      header: 'Collaborateur',
      cell: ({ row }) => employeeMap.get(row.original.employeeId) ?? row.original.employeeId,
    },
    {
      id: 'score',
      header: 'Score',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">
          {row.original.scorePercent} % ({row.original.correctAnswersCount}/
          {row.original.totalQuestionsCount})
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Résultat',
      cell: ({ row }) => (
        <Badge variant={row.original.passed ? 'success' : 'danger'}>
          {row.original.passed ? 'Réussi' : 'Échoué'}
        </Badge>
      ),
    },
    {
      id: 'completedAt',
      header: 'Date',
      cell: ({ row }) => formatDateTimeFr(row.original.completedAtUtc ?? row.original.startedAtUtc),
    },
  ];

  const items = attemptsQuery.data?.items ?? [];
  const totalCount = attemptsQuery.data?.totalCount ?? 0;
  const totalPages = attemptsQuery.data?.totalPages ?? 1;
  let errorMessage: string | undefined;
  if (attemptsQuery.error) {
    errorMessage =
      attemptsQuery.error instanceof ApiError
        ? attemptsQuery.error.detail
        : 'Impossible de charger les tentatives.';
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
        <Select
          aria-label="Filtrer par résultat"
          value={passedFilter}
          onChange={(e) => {
            setPassedFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
        >
          <option value="all">Tous les résultats</option>
          <option value="true">Réussis uniquement</option>
          <option value="false">Échoués uniquement</option>
        </Select>

        {canReadEmployees && (
          <Select
            aria-label="Filtrer par collaborateur"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les collaborateurs</option>
            {(employeesQuery.data?.items ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={attemptsQuery.isLoading}
        errorMessage={errorMessage}
        emptyTitle="Aucune tentative enregistrée"
        emptyDescription="Aucun collaborateur n’a encore passé ce QCM sur ces critères."
      />
    </div>
  );
}
