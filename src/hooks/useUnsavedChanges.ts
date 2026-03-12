import { useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";
import { useModal } from "@/context/ModalContext";

/**
 * Hook to warn users about unsaved changes when navigating away.
 * @param isDirty - Boolean indicating if there are unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
  const { showConfirm } = useModal();

  // Handlers for browser-level navigation (refresh, tab close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Most browsers require this to show the default dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handler for internal React Router navigation
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmNavigation = async () => {
        const confirmed = await showConfirm({
          title: "Thay đổi chưa được lưu",
          message: "Bạn có chắc chắn muốn rời khỏi trang này? Các thay đổi của bạn sẽ không được lưu.",
          type: "confirm",
        });

        if (confirmed) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      };

      confirmNavigation();
    }
  }, [blocker, showConfirm]);

  return blocker;
};
