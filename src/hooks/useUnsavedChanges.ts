import { useEffect, useCallback, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useModal } from "@/context/ModalContext";

/**
 * Hook to warn users about unsaved changes when navigating away.
 * @param isDirty - Boolean indicating if there are unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
  const { showConfirm } = useModal();

  const isDirtyRef = useRef(isDirty);
  // Update ref during render to ensure it's always fresh for callbacks
  isDirtyRef.current = isDirty;

  // Handlers for browser-level navigation (refresh, tab close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = ""; // Most browsers require this to show the default dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Handler for internal React Router navigation
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
      []
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
