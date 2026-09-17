import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "ورود | قندک",
  description: "ورود به حساب کاربری شیرینی‌سرای قندک",
};

export default function LoginPage() {
  return (
    <div dir="rtl" className="py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="relative grid overflow-visible lg:grid-cols-2 lg:items-stretch">
            {/* تصویر سمت راست */}
            <div className="relative z-10 min-h-[320px] overflow-hidden rounded-t-[2rem] bg-qandek-pink shadow-xl lg:min-h-[640px] lg:rounded-r-[2rem] lg:rounded-l-[1.5rem]">
              <div className="absolute inset-0 z-10 bg-gradient-to-br from-berry/10 via-transparent to-cocoa/20" />

              <div className="absolute -right-16 -top-16 z-20 h-40 w-40 rounded-full border-[18px] border-white/20" />

              <div className="absolute -bottom-20 -left-16 z-20 h-48 w-48 rounded-full border-[22px] border-white/15" />

              <Image
                src="/images/decor/login1.webp"
                alt="قندک"
                fill
                priority
                className="object-cover"
              />

              <div className="absolute inset-x-6 bottom-6 z-30 rounded-3xl border border-white/30 bg-white/15 p-5 shadow-2xl backdrop-blur-md sm:inset-x-8 sm:bottom-8 sm:p-6">
                <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  خوش برگشتی
                </span>

                <h2 className="text-xl font-bold leading-8 text-white sm:text-2xl">
                  طعم‌های شیرین،
                  <br />
                  منتظر برگشتنت هستند
                </h2>

                <p className="mt-2 max-w-sm text-xs leading-6 text-white/85 sm:text-sm">
                  وارد حساب خودت شو و سفارش‌هایت را ادامه بده.
                </p>
              </div>
            </div>

            {/* فرم سمت چپ */}
            <div className="relative z-20 -mt-4 lg:mt-0 lg:-mr-3">
              <div className="absolute inset-x-3 bottom-3 top-3 rounded-[2rem] bg-berry/10 blur-[1px] lg:inset-x-5" />

              <div className="relative flex h-full flex-col justify-center rounded-[2rem] border border-qandek-pink/60 bg-white p-6 shadow-[0_25px_70px_rgba(90,62,54,0.12)] sm:p-8 lg:min-h-[640px] lg:p-12">
                <div className="pointer-events-none absolute right-8 top-8 h-20 w-20 rounded-full bg-qandek-pink/30 blur-2xl" />

                <div className="pointer-events-none absolute bottom-8 left-8 h-24 w-24 rounded-full bg-berry/10 blur-3xl" />

                <div className="relative z-10">
                  <header className="mb-8">
                    <span className="mb-3 inline-block rounded-full bg-berry/10 px-4 py-1.5 text-xs font-medium text-berry">
                      حساب کاربری
                    </span>

                    <h1 className="mb-3 text-2xl font-black tracking-tight text-cocoa sm:text-3xl">
                      خوش اومدی به قندک
                    </h1>

                    <p className="text-sm leading-7 text-cocoa/60 sm:text-base">
                      برای ورود به حساب قبلی خود، اطلاعاتت را وارد کن.
                    </p>
                  </header>

                  <form action="/login" method="POST" className="space-y-5">
                    <Input
                      name="identifier"
                      label="ایمیل یا شماره موبایل"
                      placeholder="email@example.com یا ۰۹۱۲۳۴۵۶۷۸۹"
                      required
                    />

                    <Input
                      name="password"
                      type="password"
                      label="رمز عبور"
                      placeholder="رمز عبور"
                      required
                    />

                    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-cocoa/70">
                        <input
                          type="checkbox"
                          name="remember"
                          className="h-4 w-4 rounded border-cocoa/20 text-berry accent-berry"
                        />

                        <span>مرا به خاطر بسپار</span>
                      </label>

                      <Link
                        href="/forgot-password"
                        className="font-medium text-berry transition-colors hover:text-caramel"
                      >
                        فراموشی رمز عبور؟
                      </Link>
                    </div>

                    <div className="relative pt-2">
                      <div className="absolute inset-x-1 bottom-0 top-2 rounded-2xl bg-caramel/30" />

                      <Button
                        type="submit"
                        size="lg"
                        className="relative z-10 h-14 w-full rounded-2xl bg-berry text-base font-bold shadow-lg shadow-berry/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-berry/25 active:translate-y-1"
                      >
                        ورود به حساب
                      </Button>
                    </div>
                  </form>

                  <div className="my-7 flex items-center gap-3">
                    <div className="h-px flex-1 bg-cocoa/10" />

                    <span className="text-xs text-cocoa/40">یا</span>

                    <div className="h-px flex-1 bg-cocoa/10" />
                  </div>

                  <div className="rounded-2xl border border-qandek-pink/50 bg-qandek-cream/50 p-4 text-center">
                    <p className="text-sm text-cocoa/65">
                      هنوز حساب قندک را نداری؟
                    </p>

                    <Link
                      href="/register"
                      className="mt-1 inline-block font-bold text-berry transition-all hover:-translate-y-0.5 hover:text-caramel"
                    >
                      ساخت حساب جدید
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}