// Simple toast hook implementation
import { useState, useCallback, useRef, useEffect } from 'react';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Global toast state to avoid circular references
let globalToasts: (ToastOptions & { id: number })[] = [];
let globalListeners: Set<(toasts: (ToastOptions & { id: number })[]) => void> = new Set();

function notifyListeners() {
  globalListeners.forEach(listener => listener([...globalToasts]));
}

export function toast(options: ToastOptions) {
  const id = Date.now() + Math.random();
  globalToasts = [...globalToasts, { ...options, id }];
  notifyListeners();
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>(globalToasts);

  useEffect(() => {
    const listener = (newToasts: (ToastOptions & { id: number })[]) => {
      setToasts(newToasts);
    };
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  return { toast, toasts };
}
