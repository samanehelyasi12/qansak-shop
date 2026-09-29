"use client";

/**
 * Login and registration, wired to the Django session API.
 *
 * The form still validates what it can for a good user experience, but nothing
 * here decides anything: the backend re-checks the identifier, the password
 * strength and every duplicate, and its messages are what the user sees.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import TermsContent from "@/components/legal/TermsContent";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { ApiError, primeCsrf } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { accountSession } from "@/lib/account/session";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  const splitName = () => {
    const parts = name.trim().split(/\s+/);
    return { first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") };
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    // Get the CSRF cookie before the first write so the token is fresh.
    await primeCsrf();

    if (isRegister) {
      if (password !== passwordConfirmation) {
        setFieldErrors({ password_confirmation: "تکرار رمز عبور مطابقت ندارد." });
        return;
      }
      if (!terms) {
        setError("برای ثبت‌نام باید قوانین و مقررات را بپذیرید.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        const { first_name, last_name } = splitName();
        const user = await authApi.register({
          identifier,
          password,
          first_name,
          last_name,
          ...(referralCode.trim() ? { referral_code: referralCode.trim() } : {}),
        });
        // Publish the new session before navigating, so the header can show
        // this person's name on the first paint of the next page.
        accountSession.signIn(user);
      } else {
        const user = await authApi.login({ identifier, password });
        accountSession.signIn(user);
      }

      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/account");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors({
          identifier: caught.fieldError("identifier") ?? "",
          password: caught.fieldError("password") ?? "",
          non_field_errors: caught.fieldError("non_field_errors") ?? "",
        });
      } else {
        setError("خطای غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {isRegister && (
          <Input
            name="name"
            label="نام و نام خانوادگی"
            placeholder="نام و نام خانوادگی"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.non_field_errors || undefined}
            required
          />
        )}

        <Input
          name="identifier"
          label="ایمیل یا شماره موبایل"
          placeholder="email@example.com یا ۰۹۱۲۳۴۵۶۷۸۹"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier || undefined}
          required
        />

        <Input
          name="password"
          type="password"
          label="رمز عبور"
          placeholder="رمز عبور"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password || undefined}
          required
        />

        {isRegister ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="password_confirmation"
              type="password"
              label="تکرار رمز عبور"
              placeholder="تکرار رمز عبور"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              error={fieldErrors.password_confirmation || undefined}
              required
            />

            <Input
              name="referral_code"
              label="کد معرفی (اختیاری)"
              placeholder="کد معرفی دوستتان"
              autoComplete="off"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>
        ) : null}

        {isRegister && (
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-6 text-cocoa/60">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-cocoa/20 accent-berry"
            />

            <span>
              با ثبت‌نام،{" "}
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="font-medium text-berry underline-offset-2 transition-colors hover:text-caramel hover:underline"
              >
                قوانین و مقررات
              </button>{" "}
              قندک را می‌پذیرم.
            </span>
          </label>
        )}

        {error && !fieldErrors.non_field_errors && (
          <p
            role="alert"
            className="rounded-xl border border-berry/30 bg-berry/5 px-4 py-3 text-sm text-berry"
          >
            {error}
          </p>
        )}

        <div className="relative pt-1">
          <div className="absolute inset-x-1 bottom-0 top-2 rounded-2xl bg-caramel/30" />

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="relative z-10 h-14 w-full rounded-2xl bg-berry text-base font-bold shadow-lg shadow-berry/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-berry/25 active:translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSubmitting
              ? "لطفاً صبر کنید..."
              : isRegister
                ? "ثبت‌نام و ورود"
                : "ورود به حساب"}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="قوانین و مقررات قندک"
      >
        <div className="space-y-6 text-sm leading-7 text-cocoa/70">
          <TermsContent />

          <button
            type="button"
            onClick={() => setTermsOpen(false)}
            className="w-full rounded-xl bg-berry px-5 py-3 text-sm font-bold text-white shadow-md shadow-berry/20 transition-all hover:bg-caramel"
          >
            متوجه شدم
          </button>
        </div>
      </Modal>
    </>
  );
}

export type { Mode };
