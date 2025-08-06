import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/Toast';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test message', 'info')}>Show Info Toast</button>
      <button onClick={() => showToast('Error message', 'error')}>Show Error Toast</button>
      <button onClick={() => showToast('Warning message', 'warning')}>Show Warning Toast</button>
      <button onClick={() => showToast('Success message', 'success')}>Show Success Toast</button>
    </div>
  );
};

describe('Toast Components', () => {
  it('should throw error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  it('should display toast with correct message and severity', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show info toast
    const infoButton = screen.getByText('Show Info Toast');
    await user.click(infoButton);

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledInfo');
  });

  it('should display error toast with correct styling', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show error toast
    const errorButton = screen.getByText('Show Error Toast');
    await user.click(errorButton);

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledError');
  });

  it('should display warning toast with correct styling', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show warning toast
    const warningButton = screen.getByText('Show Warning Toast');
    await user.click(warningButton);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledWarning');
  });

  it('should display success toast with correct styling', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show success toast
    const successButton = screen.getByText('Show Success Toast');
    await user.click(successButton);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledSuccess');
  });

  it('should display and close toast correctly', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show toast
    const infoButton = screen.getByText('Show Info Toast');
    await user.click(infoButton);

    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Close toast manually
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });
});
