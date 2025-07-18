import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export interface SnackbarMessage {
  message: string;
  severity: AlertColor;
  autoHideDuration?: number;
}

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertColor, autoHideDuration?: number) => void;
  showSuccessMessage: (message: string) => void;
  showErrorMessage: (message: string) => void;
  showWarningMessage: (message: string) => void;
  showInfoMessage: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
    autoHideDuration: number;
  }>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000,
  });

  const showSnackbar = (
    message: string, 
    severity: AlertColor = 'info', 
    autoHideDuration: number = 6000
  ) => {
    setSnackbarState({
      open: true,
      message,
      severity,
      autoHideDuration,
    });
  };

  const showSuccessMessage = (message: string) => {
    showSnackbar(message, 'success');
  };

  const showErrorMessage = (message: string) => {
    showSnackbar(message, 'error', 10000); // 錯誤訊息顯示更長時間
  };

  const showWarningMessage = (message: string) => {
    showSnackbar(message, 'warning');
  };

  const showInfoMessage = (message: string) => {
    showSnackbar(message, 'info');
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarState(prev => ({ ...prev, open: false }));
  };

  const contextValue: SnackbarContextType = {
    showSnackbar,
    showSuccessMessage,
    showErrorMessage,
    showWarningMessage,
    showInfoMessage,
  };

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={snackbarState.autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={snackbarState.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};