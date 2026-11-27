import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PERMISSIONS, hasAllPermissions, hasAnyPermission, hasPermission } from '../permissions';

describe('Permissions Helpers', () => {
  const userPerms = [PERMISSIONS.EMPLOYEES_READ_SELF, PERMISSIONS.COMPANIES_READ];

  it('evaluates single, any, and all permission checks', () => {
    expect(hasPermission(userPerms, PERMISSIONS.COMPANIES_READ)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.COMPANIES_WRITE)).toBe(false);

    expect(
      hasAnyPermission(userPerms, [PERMISSIONS.COMPANIES_WRITE, PERMISSIONS.COMPANIES_READ]),
    ).toBe(true);
    expect(hasAnyPermission(userPerms, [PERMISSIONS.COMPANIES_WRITE, PERMISSIONS.ROLES_READ])).toBe(
      false,
    );
    expect(hasAnyPermission(userPerms, [])).toBe(true);

    expect(
      hasAllPermissions(userPerms, [PERMISSIONS.EMPLOYEES_READ_SELF, PERMISSIONS.COMPANIES_READ]),
    ).toBe(true);
    expect(
      hasAllPermissions(userPerms, [PERMISSIONS.EMPLOYEES_READ_SELF, PERMISSIONS.COMPANIES_WRITE]),
    ).toBe(false);
  });

  it('renders a placeholder check cleanly', () => {
    render(<span>{hasPermission(userPerms, PERMISSIONS.COMPANIES_READ) ? 'OK' : 'NO'}</span>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
