import React from 'react';

export interface ToastContextType {
  showToast: (message: string, severity?: 'error' | 'warning' | 'info' | 'success') => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);
