import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OverviewPage from './Overview';

const authState = vi.hoisted(() => ({ activeRole: 'employee' }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ activeRole: authState.activeRole }),
}));

describe('OverviewPage', () => {
  beforeEach(() => {
    authState.activeRole = 'employee';
  });

  it('handles a transition from a restricted role to an authorized role', () => {
    const view = render(<OverviewPage />);

    expect(screen.getByText('Access Restricted')).toBeTruthy();

    authState.activeRole = 'super_admin';

    expect(() => view.rerender(<OverviewPage />)).not.toThrow();
    expect(screen.getByText('Overview')).toBeTruthy();
  });
});
