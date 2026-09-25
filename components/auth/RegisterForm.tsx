"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TermsContent from "@/components/legal/TermsContent";

export default function RegisterForm() {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <>
      <form action="/register" method="POST" className="space-y-4">
        {/* نام */}
        <Input
          name="name"
          label="نام و نام خانوادگی"
          placeholder="نام و نام خانوادگی"
          autoComplete="name"
          required
        />

        {/* ایمیل یا موبایل */}
        <Input
          name="identifier"
          label="ایمیل یا شماره موبایل"
          placeholder="email@example.com یا ۰۹۱۲۳۴۵۶۷۸۹"
          autoComplete="username"
          required
        />

        {/* رمزها */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="password"
            type="password"
            label="رمز عبور"
            placeholder="رمز عبور"
            autoComplete="new-password"
            required
          />

          <Input
            name="password_confirmation"
            type="password"
            label="تکرار رمز عبور"
            placeholder="تکرار رمز عبور"
            autoComplete="new-password"
            required
          />
        </div>

        {/* قوانین */}
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-6 text-cocoa/60">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 shrink-0 rounded border-cocoa/20 accent-berry"
          />

          <span>
            با ثبت‌نام،{" "}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="font-medium text-berry underline-offset-2 transition-colors hover:text-caramel hover:underline"
            >
              قوانین و شرایط
            </button>{" "}
            قندک را می‌پذیرم.
          </span>
        </label>

        {/* دکمه */}
        <div className="relative pt-1">
          <div className="absolute inset-x-1 bottom-0 top-1 rounded-2xl bg-caramel/30" />

          <Button
            type="submit"
            size="lg"
            className="relative z-10 h-14 w-full rounded-2xl bg-berry text-base font-bold shadow-lg shadow-berry/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-berry/25 active:translate-y-1"
          >
            ساخت حساب
          </Button>
        </div>
      </form>

      {/* جداکننده */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-cocoa/10" />

        <span className="text-xs text-cocoa/40">
          یا
        </span>

        <div className="h-px flex-1 bg-cocoa/10" />
      </div>

      {/* ورود */}
      <div className="rounded-2xl border border-qandek-pink/50 bg-qandek-cream/50 p-4 text-center">
        <p className="text-sm text-cocoa/65">
          قبلاً در قندک ثبت‌نام کرده‌ای؟
        </p>

        <Link
          href="/login"
          className="mt-1 inline-block font-bold text-berry transition-all hover:-translate-y-0.5 hover:text-caramel"
        >
          ورود به حساب
        </Link>
      </div>

      {/* مودال قوانین */}
      <Modal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="قوانین و شرایط قندک"
      >
        <div className="space-y-6 text-sm leading-7 text-cocoa/70">
          <TermsContent />

          <button
            type="button"
            onClick={() => setTermsOpen(false)}
            className="w-full rounded-xl bg-berry px-5 py-3 text-sm font-bold text-white shadow-md shadow-berry/20 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            متوجه شدم
          </button>
        </div>
      </Modal>
    </>
  );
}