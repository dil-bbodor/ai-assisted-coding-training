import React, { useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { ToastContext } from './ToastContext';

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showToast = (
    message: string,
    severity: 'error' | 'warning' | 'info' | 'success' = 'info'
  ) => {
    setToast({ open: true, message, severity });
  };

  const handleClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  // Auto-hide toast after 6 seconds
  useEffect(() => {
    if (toast.open) {
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [toast.open]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={toast.open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
