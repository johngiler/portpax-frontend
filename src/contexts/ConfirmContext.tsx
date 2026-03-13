"use client";

import { createContext, useCallback, useContext, useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

type ConfirmContextValue = {
  requestConfirm: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const requestConfirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setOptions(null);
  }, []);

  const handleConfirm = useCallback(() => {
    options?.onConfirm();
    setOpen(false);
    setOptions(null);
  }, [options]);

  return (
    <ConfirmContext.Provider value={{ requestConfirm }}>
      {children}
      {options && (
        <ConfirmModal
          open={open}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={options.title}
          message={options.message}
          confirmLabel={options.confirmLabel}
          danger={options.danger}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
