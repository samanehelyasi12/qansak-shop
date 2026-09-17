"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

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
          required
        />

        {/* ایمیل یا موبایل */}
        <Input
          name="identifier"
          label="ایمیل یا شماره موبایل"
          placeholder="email@example.com یا ۰۹۱۲۳۴۵۶۷۸۹"
          required
        />

        {/* رمزها */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="password"
            type="password"
            label="رمز عبور"
            placeholder="رمز عبور"
            required
          />

          <Input
            name="password_confirmation"
            type="password"
            label="تکرار رمز عبور"
            placeholder="تکرار رمز عبور"
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
          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۱. پذیرش شرایط
            </h3>

            <p>
              با ایجاد حساب کاربری و استفاده از خدمات قندک، شما تأیید
              می‌کنید که این شرایط را مطالعه کرده و با مفاد آن موافق
              هستید.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۲. اطلاعات حساب کاربری
            </h3>

            <p>
              کاربر موظف است اطلاعات صحیح و به‌روز وارد کند و مسئولیت
              حفظ اطلاعات ورود به حساب کاربری خود را بر عهده دارد.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۳. ثبت سفارش
            </h3>

            <p>
              سفارش پس از تکمیل مراحل ثبت و پرداخت، مطابق وضعیت نمایش داده
              شده در سایت پردازش خواهد شد. قیمت و موجودی محصولات ممکن است
              تغییر کند و سفارش بر اساس اطلاعات زمان ثبت نهایی بررسی می‌شود.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۴. پرداخت
            </h3>

            <p>
              تکمیل موفقیت‌آمیز پرداخت به معنای ثبت درخواست پرداخت برای
              سفارش است. در صورت ناموفق بودن پرداخت، سفارش مطابق وضعیت
              تعیین‌شده در سیستم مدیریت خواهد شد.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۵. ارسال و تحویل
            </h3>

            <p>
              سفارش‌ها بر اساس محدوده و زمان‌بندی اعلام‌شده توسط قندک ارسال
              می‌شوند. زمان تحویل ممکن است تحت تأثیر شرایط خارج از کنترل
              مجموعه قرار بگیرد.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۶. لغو یا تغییر سفارش
            </h3>

            <p>
              شرایط لغو یا تغییر سفارش با توجه به وضعیت سفارش و نوع محصول
              تعیین می‌شود. پس از شروع آماده‌سازی بعضی محصولات، امکان تغییر
              یا لغو ممکن است محدود باشد.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۷. حریم خصوصی
            </h3>

            <p>
              اطلاعات کاربران برای ایجاد حساب، پردازش سفارش و ارائه خدمات
              استفاده می‌شود. نحوه نگهداری و استفاده از اطلاعات در سیاست
              حریم خصوصی سایت توضیح داده خواهد شد.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-cocoa">
              ۸. تغییر شرایط
            </h3>

            <p>
              قندک می‌تواند در صورت نیاز شرایط استفاده را به‌روزرسانی کند.
              نسخه جدید شرایط پس از انتشار در سایت قابل مشاهده خواهد بود.
            </p>
          </section>

          <div className="rounded-2xl bg-qandek-cream/70 p-4 text-xs leading-6 text-cocoa/60">
            این متن فعلاً برای طراحی و محتوای اولیه سایت است و قبل از
            انتشار نهایی باید با شرایط واقعی کسب‌وکار و الزامات قانونی
            محل فعالیت قندک تطبیق داده شود.
          </div>

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