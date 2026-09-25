import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

/**
 * حالت «سبد خرید خالی» — همان markup موجود قبلی، بدون هیچ تغییر بصری.
 * در صفحهٔ سبد و مراحل چک‌اوت مشترک استفاده می‌شود.
 */
export default function EmptyCart() {
  return (
    <div className="py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-xl border border-cream bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
            <svg className="h-8 w-8 text-caramel" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-cocoa">سبد خرید شما خالی است</h1>
          <p className="mb-8 text-cocoa/70">
            هنوز محصولی به سبد اضافه نکرده‌اید. از شیرینی‌های تازه قندک شروع کنید.
          </p>
          <Link href="/categories/cake">
            <Button size="lg" className="w-full cursor-pointer">
              شروع خرید
            </Button>
          </Link>
          <Link href="/" className="mt-4 block">
            <Button variant="secondary" size="lg" className="w-full cursor-pointer">
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
