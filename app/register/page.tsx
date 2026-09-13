import { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "ثبت‌نام | قندک",
  description: "ایجاد حساب کاربری در شیرینی‌سرای قندک",
};

export default function RegisterPage() {
  return (
    <div className="py-16">
      <Container>
        <div className="max-w-md mx-auto">
          <header className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-cocoa">ثبت‌نام در قندک</h1>
            <p className="text-cocoa/70">برای سفارش سریع‌تر و پیگیری خریدها ثبت‌نام کنید</p>
          </header>

          <form className="space-y-4 rounded-xl border border-cream bg-white p-6" action="/register" method="POST">
            <Input name="firstName" label="نام" placeholder="علی" required />
            <Input name="lastName" label="نام خانوادگی" placeholder="محمدی" required />
            <Input name="email" type="email" label="ایمیل" placeholder="email@example.com" required />
            <Input name="phone" type="tel" label="شماره موبایل" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required />
            <Input
              name="password"
              type="password"
              label="رمز عبور"
              placeholder="حداقل ۸ کاراکتر"
              required
              minLength={8}
            />
            <Input
              name="confirmPassword"
              type="password"
              label="تکرار رمز عبور"
              placeholder="تکرار رمز عبور"
              required
            />
            <Button type="submit" size="lg" className="w-full">
              ثبت‌نام
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-cocoa/70">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" className="text-caramel hover:underline font-medium">
              ورود
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}