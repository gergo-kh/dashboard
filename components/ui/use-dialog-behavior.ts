"use client";

import { useCallback, useEffect, useRef } from "react";

type UseDialogBehaviorOptions = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function useDialogBehavior({ isOpen, onClose }: UseDialogBehaviorOptions) {
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldReturnFocusRef = useRef(false);

  const closeDialog = useCallback(() => {
    shouldReturnFocusRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (shouldReturnFocusRef.current) {
        shouldReturnFocusRef.current = false;
        triggerRef.current?.focus();
      }

      return undefined;
    }

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    first?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key !== "Tab" || !first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeDialog, isOpen]);

  return {
    closeDialog,
    dialogRef,
    triggerRef
  };
}
