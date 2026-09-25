"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** نام قابل‌دسترس برای مودالی که عنوان قابل‌مشاهده ندارد. */
const FALLBACK_LABEL = "پنجره";

/** المان‌هایی که فوکوس می‌تواند روی آن‌ها قرار بگیرد (بصری و غیربصری). */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // مرجع رویداد، تا افکت به هویت تابع onClose وابسته نشود.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () => {
      const root = dialogRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
    };

    // فوکوس را داخل مودال می‌بریم: ابتدا خود دیالوگ، وگرنه اولین المان قابل فوکوس.
    const focusTarget = getFocusable()[0] ?? dialogRef.current;
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      // فقط Tab/Shift+Tab را مدیریت می‌کنیم تا فوکوس از مودال بیرون نرود.
      if (event.key !== "Tab") return;

      const focusable = getFocusable();

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === dialogRef.current) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(() => {
    onCloseRef.current();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-cocoa/40 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : FALLBACK_LABEL}
        aria-labelledby={title ? "modal-title" : undefined}
        tabIndex={-1}
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-qandek-pink/60 bg-white shadow-[0_30px_90px_rgba(90,62,54,0.25)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cocoa/10 bg-qandek-cream/40 px-5 py-4 sm:px-7 sm:py-5">
          {title ? (
            <h2
              id="modal-title"
              className="text-lg font-bold text-cocoa sm:text-xl"
            >
              {title}
            </h2>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cocoa/50 transition-all hover:bg-berry/10 hover:text-berry"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}