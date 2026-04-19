"use client";

import { useState, useCallback, useRef } from "react";
import { Modal } from "./Modal";

type ConfirmTone = "default" | "danger";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((v: boolean) => void) | null;
}

const EMPTY: ConfirmState = {
  open: false,
  title: "",
  resolve: null,
};

/**
 * Hook returning a `confirm(options)` async function plus the dialog element.
 *
 * Usage in any client component:
 *   const { confirm, dialog } = useConfirm();
 *   const ok = await confirm({ title: "Delete?", tone: "danger" });
 *   return <>{dialog}{ok && <DeletedBanner/>}</>
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(EMPTY);
  const stateRef = useRef(state);
  stateRef.current = state;

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? "Confirm",
        cancelLabel: opts.cancelLabel ?? "Cancel",
        tone: opts.tone ?? "default",
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      stateRef.current.resolve?.(result);
      setState(EMPTY);
    },
    []
  );

  const dialog = (
    <Modal
      open={state.open}
      onClose={() => handleClose(false)}
      title={state.title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            {state.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className={
              state.tone === "danger"
                ? "px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                : "px-4 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
            }
          >
            {state.confirmLabel}
          </button>
        </div>
      }
    >
      {state.message && <p className="text-sm text-gray-700">{state.message}</p>}
    </Modal>
  );

  return { confirm, dialog };
}
