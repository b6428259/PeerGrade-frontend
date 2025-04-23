'use client';

import React, { createContext, useContext, useState } from 'react';
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

// Custom toast context to manage global toasts
interface ToastContextType {
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  const showSuccessToast = (message: string) => {
    toast({
      title: 'Success',
      description: message,
      variant: 'default',
      className: 'bg-green-500 text-white',
    });
  };

  const showErrorToast = (message: string) => {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  };

  const showWarningToast = (message: string) => {
    toast({
      title: 'Warning',
      description: message,
      variant: 'default',
      className: 'bg-yellow-500 text-white',
    });
  };

  return (
    <ToastContext.Provider value={{ 
      showSuccessToast, 
      showErrorToast, 
      showWarningToast 
    }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

// Custom hook to use toast context
export const useCustomToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useCustomToast must be used within a ToastContextProvider');
  }
  return context;
};