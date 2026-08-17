import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-pine-950/70 backdrop-blur-[3px] fadein" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`pop relative w-full ${wide ? "max-w-2xl" : "max-w-md"} panel bg-pine-850 shadow-2xl shadow-black/50 max-h-[92vh] overflow-y-auto scroll-slim`}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-coral-400/12 text-coral-400 border border-coral-400/20">
            <Icon name="info" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-fog-100">{title}</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-fog-400">{body}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-fog-300 border border-white/8 hover:bg-white/5 hover:text-fog-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg px-4 py-2.5 text-[14px] font-semibold bg-coral-400 text-pine-950 hover:bg-coral-300 active:scale-[0.97] transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------- Toasts --------------------------------- */

export type ToastTone = "ok" | "danger" | "info";

export interface ToastItem {
  id: number;
  msg: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

export function ToastHost({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toastin panel bg-pine-800 flex items-center gap-3 px-4 py-3 shadow-xl shadow-black/40"
        >
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
              t.tone === "ok"
                ? "bg-lime-400/15 text-lime-400"
                : t.tone === "danger"
                  ? "bg-coral-400/15 text-coral-400"
                  : "bg-sky-400/15 text-sky-400"
            }`}
          >
            <Icon name={t.tone === "ok" ? "check" : t.tone === "danger" ? "trash" : "info"} size={14} strokeWidth={2.2} />
          </span>
          <p className="flex-1 text-[13.5px] leading-snug text-fog-200">{t.msg}</p>
          {t.actionLabel && (
            <button
              onClick={() => {
                t.onAction?.();
                dismiss(t.id);
              }}
              className="shrink-0 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-lime-400 bg-lime-400/10 hover:bg-lime-400/20 transition-colors"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-fog-600 hover:text-fog-200 transition-colors"
            aria-label="Dismiss"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- CountUp --------------------------------- */

export function CountUp({
  value,
  format,
  duration = 750,
  className,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [disp, setDisp] = useState(0);
  const prev = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) {
      setDisp(to);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(from + (to - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span className={className}>{format(disp)}</span>;
}
