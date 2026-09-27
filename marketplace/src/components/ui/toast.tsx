"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const DISMISS_AFTER_MS = 8000;

/**
 * App-wide notification area. Messages live in a polite live region, stay visible while
 * hovered or focused, and can be dismissed manually.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [paused, setPaused] = useState(false);

  const show = useCallback((message: string, tone: Tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = setTimeout(() => setToast(null), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [toast, paused]);

  return (
    <ToastContext value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end sm:p-6"
      >
        {toast && (
          <div
            key={toast.id}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            ) : (
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-300" />
            )}
            <p className="flex-1 leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className={cn(
                "-m-1 rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
              aria-label="Dismiss notification"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>
    </ToastContext>
  );
}
