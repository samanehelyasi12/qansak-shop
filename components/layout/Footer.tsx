import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="border-t border-qandek-pink/40 bg-qandek-pink/20 py-12">
      <Container>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-bold text-qandek-strawberry">قندک</h3>
            <p className="text-sm text-cocoa/80">
              شیرینی‌سرای قندک با بیش از ده سال تجربه، تولیدکننده انواع کیک، شیرینی، نان و شکلات دست‌ساز
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-cocoa">دسترسی سریع</h4>
            <div className="flex flex-col gap-2 text-sm text-cocoa/80 sm:flex-row sm:items-center sm:gap-4">
              <Link href="/about" className="hover:text-qandek-strawberry">
                درباره ما
              </Link>
              <span className="hidden text-cocoa/30 sm:block" aria-hidden="true">
                /
              </span>
              <Link href="/contact" className="hover:text-qandek-strawberry">
                تماس با ما
              </Link>
              <span className="hidden text-cocoa/30 sm:block" aria-hidden="true">
                /
              </span>
              <Link href="/cart" className="hover:text-qandek-strawberry">
                سبد خرید
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-cocoa">تماس با ما</h4>
            <ul className="flex flex-col gap-2 text-sm text-cocoa/80">
              <li>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
              <li>آدرس: تهران، خیابان ولیعصر</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-qandek-pink/40 pt-6 text-center text-sm text-cocoa/60">
          <p>&copy; {new Date().getFullYear()} قندک. تمامی حقوق محفوظ است.</p>
        </div>
      </Container>
    </footer>
  );
}
