"use client";

import { useEffect, useState } from "react";

interface CheckoutStepperProps {
  /** 1 = سبد خرید, 2 = اطلاعات ارسال, 3 = پرداخت, 4 = تایید سفارش */
  currentStep: 1 | 2 | 3 | 4;
}

const STORAGE_KEY = "qandak_checkout_step";

const steps = [
  { key: "cart", label: "سبد خرید", icon: CartIcon },
  { key: "shipping", label: "اطلاعات ارسال", icon: ShippingIcon },
  { key: "payment", label: "پرداخت", icon: PaymentIcon },
  { key: "confirm", label: "تایید سفارش", icon: ConfirmIcon },
] as const;

/** ارقام فارسی برای متن فقط-خوانده‌شونده با صفحه‌خوان. */
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export default function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  // در اولین رندر، مرحله‌ی قبلی (ذخیره‌شده از صفحه‌ی قبل) رو نشون می‌دیم؛
  // بعد از mount، با یک تأخیر کوتاه به مرحله‌ی واقعی صفحه می‌رسیم تا خط/آیکن‌ها
  // جلوی چشم کاربر animate بشن، نه این‌که یهو کامل پر رندر بشن.
  const [displayStep, setDisplayStep] = useState<1 | 2 | 3 | 4>(currentStep);

  useEffect(() => {
    let previousStep = currentStep;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (parsed >= 1 && parsed <= 4) previousStep = parsed as 1 | 2 | 3 | 4;
      }
    } catch {
      // sessionStorage در دسترس نیست (مثلاً SSR)؛ نادیده می‌گیریم
    }

    if (previousStep !== currentStep) {
      setDisplayStep(previousStep);
      const frame = requestAnimationFrame(() => {
        setTimeout(() => setDisplayStep(currentStep), 50);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setDisplayStep(currentStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(currentStep));
    } catch {
      // نادیده گرفتن خطای احتمالی sessionStorage
    }
  }, [currentStep]);

  const fillPercent = ((displayStep - 1) / (steps.length - 1)) * 100;

  return (
    <nav aria-label="مراحل خرید" dir="rtl" className="w-full">
      <ol className="relative flex items-start justify-between px-2 sm:px-6">
        {/* خط پس‌زمینه، بین مرکز اولین و آخرین آیکن */}
        <div
          className="absolute top-5 h-0.5 bg-cream"
          style={{ insetInlineStart: "calc(12.5%)", insetInlineEnd: "calc(12.5%)" }}
          aria-hidden="true"
        />
        {/* خط پرشده: از راست به چپ رشد می‌کند، با انیمیشن روان حتی بین صفحات */}
        <div
          className="absolute top-5 h-0.5 bg-caramel transition-all duration-700 ease-out"
          style={{ insetInlineStart: "calc(12.5%)", width: `calc(${fillPercent}% * 0.75)` }}
          aria-hidden="true"
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < displayStep;
          const isActive = stepNumber === displayStep;
          const Icon = step.icon;

          return (
            <li
              key={step.key}
              className="relative z-10 flex flex-1 flex-col items-center"
              aria-current={isActive ? "step" : undefined}
            >
              {/* معادل متنی وضعیت مرحله برای صفحه‌خوان؛ هیچ اثر بصری ندارد. */}
              <span className="sr-only">
                {`مرحله ${toPersianDigits(stepNumber)} از ${toPersianDigits(steps.length)}`}
                {isActive ? " (مرحله فعلی)" : isDone ? " (انجام شده)" : ""}
              </span>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out ${
                  isDone
                    ? "border-caramel bg-caramel text-white scale-100"
                    : isActive
                    ? "border-caramel bg-white text-caramel scale-110"
                    : "border-cream bg-white text-cream scale-100"
                }`}
              >
                {isDone ? <CheckIcon /> : <Icon />}
              </div>
              <span
                className={`mt-2 max-w-[5.5rem] text-center text-[11px] font-medium leading-tight transition-colors duration-500 sm:text-xs ${
                  isDone || isActive ? "text-cocoa" : "text-cocoa/40"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function CartIcon() {
  return (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </IconBase>
  );
}

function ShippingIcon() {
  return (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5M6.75 3v18m10.5-18v18" />
    </IconBase>
  );
}

function PaymentIcon() {
  return (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 8.25v10.5A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V8.25M2.25 8.25V6A2.25 2.25 0 0 1 4.5 3.75h15A2.25 2.25 0 0 1 21.75 6v2.25M6 15.75h3" />
    </IconBase>
  );
}

function ConfirmIcon() {
  return (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </IconBase>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}