import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeProvider';

function ThemeHarness() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{resolvedTheme}</span>
      <button type="button" onClick={toggleTheme}>
        Basculer
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('toggles theme class on documentElement', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    await user.click(screen.getByRole('button', { name: 'Basculer' }));
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
