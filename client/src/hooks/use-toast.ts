// Simple toast hook implementation
import { useState, useCallback } from 'react';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCallback: ((options: ToastOptions) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...options, id }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    
    // Also trigger global toast if available
    if (toastCallback) {
      toastCallback(options);
    }
  }, []);

  // Register global toast callback
  if (!toastCallback) {
    toastCallback = toast;
  }

  return { toast, toasts };
}
