import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SavedReports from './SavedReports';

const authState = vi.hoisted(() => ({ activeRole: 'employee' }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ activeRole: authState.activeRole }),
}));

describe('SavedReports', () => {
  beforeEach(() => {
    authState.activeRole = 'employee';
  });

  it('handles a transition from a restricted role to an authorized role', () => {
    const view = render(<SavedReports />);

    expect(screen.getByText('Access Restricted')).toBeTruthy();

    authState.activeRole = 'head_hr';

    expect(() => view.rerender(<SavedReports />)).not.toThrow();
    expect(screen.getByText('Saved Reports')).toBeTruthy();
  });
});
