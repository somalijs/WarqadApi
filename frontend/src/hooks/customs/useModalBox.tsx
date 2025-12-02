import { useState, useCallback } from 'react';

export function useModalBox<T = unknown>(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [state, setState] = useState<T | null>(null);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback((callback?: () => void) => {
    setIsOpen(false);
    setState(null);
    if (callback) {
      callback();
    }
  }, []);
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);
  const clearState = useCallback(() => setState(null), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setState,
    state,
    clearState,
  };
}
