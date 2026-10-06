import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import Modal from "./Modal";
import * as ui from "./tableStyles";

interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** "danger" shows a red confirm button (discharge, cancel, remove). */
  tone?: "danger" | "primary";
  /** Only one button (an information message instead of a question). */
  alertOnly?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

/** In-app replacement for window.confirm / window.alert, styled like the rest of the system. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    o =>
      new Promise<boolean>(resolve => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOpts(o);
      }),
    []
  );

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <Modal
          title={opts.title}
          onClose={() => close(false)}
          footer={
            <>
              {!opts.alertOnly && (
                <button type="button" onClick={() => close(false)} className={ui.secondaryBtn}>
                  {opts.cancelText || "Cancel"}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={
                  opts.tone === "danger"
                    ? "px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    : ui.primaryBtn
                }
              >
                {opts.confirmText || (opts.alertOnly ? "OK" : "Confirm")}
              </button>
            </>
          }
        >
          <div className="text-sm text-slate-700 leading-relaxed">{opts.message}</div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  // Outside the provider (should not happen) fall back to the browser dialog
  return fn || (async o => (o.alertOnly ? (window.alert(String(o.message)), true) : window.confirm(String(o.message))));
}
