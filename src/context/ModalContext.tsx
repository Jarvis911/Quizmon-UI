import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ModalType = "info" | "success" | "warning" | "error" | "confirm";

interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (options: ModalOptions) => void;
  showConfirm: (options: ModalOptions) => Promise<boolean>;
  closeModal: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
  modalOptions: ModalOptions | null;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);
  const [confirmPromise, setConfirmPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const showAlert = useCallback((options: ModalOptions) => {
    setModalOptions({ ...options, type: options.type || "info" });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((options: ModalOptions): Promise<boolean> => {
    setModalOptions({ ...options, type: "confirm" });
    setIsOpen(true);
    return new Promise((resolve) => {
      setConfirmPromise({ resolve });
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    if (confirmPromise) {
      confirmPromise.resolve(false);
      setConfirmPromise(null);
    }
  }, [confirmPromise]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (modalOptions?.onConfirm) modalOptions.onConfirm();
    if (confirmPromise) {
      confirmPromise.resolve(true);
      setConfirmPromise(null);
    }
  }, [modalOptions, confirmPromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (modalOptions?.onCancel) modalOptions.onCancel();
    if (confirmPromise) {
      confirmPromise.resolve(false);
      setConfirmPromise(null);
    }
  }, [modalOptions, confirmPromise]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal, handleConfirm, handleCancel, modalOptions, isOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
