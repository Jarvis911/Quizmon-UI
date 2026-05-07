import React from "react";
import { useModal } from "@/context/ModalContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2, Info, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const GlobalModal = () => {
  const { modalOptions, isOpen, handleConfirm, handleCancel } = useModal();

  if (!modalOptions) return null;

  const { title, message, type = "info", cancelText = "Hủy", onConfirm, confirmText: confirmTextOpt } =
    modalOptions;
  /** Two-step dialogs: explicit confirm type, or showAlert with async action (warning delete, etc.). */
  const needsCancel = type === "confirm" || Boolean(onConfirm);
  const confirmText =
    confirmTextOpt ??
    (needsCancel && type !== "success" && type !== "error" ? "Xác nhận" : "OK");

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />;
      case "error":
        return <XCircle className="w-8 h-8 md:w-12 md:h-12 text-rose-500" />;
      case "warning":
        return <AlertCircle className="w-8 h-8 md:w-12 md:h-12 text-amber-500" />;
      case "confirm":
        return <HelpCircle className="w-8 h-8 md:w-12 md:h-12 text-primary" />;
      default:
        return <Info className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="max-w-md w-[90vw] md:w-full rounded-3xl p-6 md:p-6">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="mb-2 md:mb-4 p-3 md:p-4 rounded-2xl md:rounded-3xl bg-slate-50 border-2 border-slate-100/50 shadow-inner transition-transform">
            {getIcon()}
          </div>
          <AlertDialogTitle className="text-xl md:text-3xl font-black text-slate-900 leading-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm md:text-lg font-bold text-slate-500 mt-1 md:mt-2 opacity-90 leading-relaxed">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
          {needsCancel && (
            <AlertDialogCancel
              onClick={handleCancel}
              className="w-full sm:w-auto min-w-[120px] bg-slate-100 hover:bg-slate-200 border-none text-slate-700 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction 
            onClick={handleConfirm}
            className={cn(
              "w-full sm:w-auto min-w-[120px] shadow-lg transition-all hover:scale-105 active:scale-95",
              type === "error" ? "bg-rose-500 hover:bg-rose-600" : 
              type === "success" ? "bg-emerald-500 hover:bg-emerald-600" :
              type === "warning" ? "bg-amber-500 hover:bg-amber-600" :
              "bg-primary hover:bg-primary/90"
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GlobalModal;
