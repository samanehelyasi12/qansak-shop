import { Metadata } from "next";
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
    <div className="py-16">
      <Container>
        <div className="max-w-md mx-auto">
          <header className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-cocoa">ورود به قندک</h1>
            <p className="text-cocoa/70">برای دسترسی به حساب کاربری خود وارد شوید</p>
          </header>

          <form className="space-y-4 rounded-xl border border-cream bg-white p-6" action="/login" method="POST">
            <Input name="identifier" label="ایمیل یا موبایل" placeholder="email@example.com یا ۰۹۱۲۳۴۵۶۷۸۹" required />
            <Input name="password" type="password" label="رمز عبور" placeholder="رمز عبور" required />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="remember" className="h-4 w-4 text-caramel rounded" />
                <span className="text-sm text-cocoa">مرا به خاطر بسپار</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-caramel hover:underline">
                فراموشی رمز عبور؟
              </Link>
            </div>
            <Button type="submit" size="lg" className="w-full">
              ورود
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-cocoa/70">حساب کاربری ندارید؟{" "}
              <Link href="/register" className="text-caramel hover:underline font-medium">
                ثبت‌نام
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}