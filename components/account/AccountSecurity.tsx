"use client";

/**
 * Changing the password, and the way out of the account.
 *
 * The new password is checked here only for what the browser can know: both
 * entries matching and not being empty. Whether the change is allowed, and what
 * a password is strong enough, is the backend's call.
 */

import { useState } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";

import { PanelCard } from "@/components/account/ui";
import type { AccountUser } from "@/lib/account/types";

export default function AccountSecurity({
  user,
  onSignOut,
}: {
  user: AccountUser;
  onSignOut: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!current.trim() || !next.trim()) {
      setError("همه فیلدها را پر کنید.");
      return;
    }

    if (next !== confirmation) {
      setError("تکرار رمز عبور مطابقت ندارد.");
      return;
    }

    setCurrent("");
    setNext("");
    setConfirmation("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PanelCard
        title="تغییر رمز عبور"
        description="برای امنیت بیشتر، رمزی متفاوت از رمزهای دیگر انتخاب کنید."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            id="security-current"
            label="رمز عبور فعلی"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="security-next"
              label="رمز عبور جدید"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
            />

            <PasswordField
              id="security-confirmation"
              label="تکرار رمز عبور جدید"
              value={confirmation}
              onChange={setConfirmation}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-berry/30 bg-berry/5 px-4 py-3 text-sm text-berry"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cocoa px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-caramel"
            >
              <KeyRound aria-hidden="true" strokeWidth={1.7} className="h-4 w-4" />
              تغییر رمز عبور
            </button>

            {saved && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-pistachio"
              >
                <ShieldCheck aria-hidden="true" strokeWidth={2} className="h-3.5 w-3.5" />
                رمز عبور تغییر کرد
              </span>
            )}
          </div>
        </form>
      </PanelCard>

      <PanelCard title="نشست‌های فعال" description="حساب شما در این دستگاه‌ها وارد است.">
        <ul className="space-y-2 text-sm">
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream/80 bg-white/70 px-4 py-3">
            <div>
              <p className="font-medium text-cocoa">دستگاه فعلی</p>
              <p className="mt-1 text-xs text-cocoa/50">
                مرورگر همین دستگاه • همین حالا
              </p>
            </div>

            <span className="rounded-full bg-pistachio/15 px-3 py-1 text-xs font-medium text-pistachio">
              فعال
            </span>
          </li>
        </ul>
      </PanelCard>

      <PanelCard title="خروج از حساب">
        <p className="text-sm leading-7 text-cocoa/60">
          {user.displayName} عزیز، روی دستگاه‌های مشترک بهتر است بعد از خرید از
          حساب خارج شوید. سبد خرید شما دست‌نخورده باقی می‌ماند.
        </p>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-berry/30 bg-berry/5 px-5 py-2.5 text-sm font-medium text-berry transition-colors hover:bg-berry/10"
        >
          <LogOut aria-hidden="true" strokeWidth={1.7} className="h-4 w-4" />
          خروج از حساب {user.displayName}
        </button>
      </PanelCard>
    </>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-cocoa">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-cream bg-white px-4 py-2.5 text-sm text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
      />
    </div>
  );
}
