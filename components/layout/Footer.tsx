import Link from "next/link";
import Container from "@/components/ui/Container";

const quickLinks = [
  { label: "خانه", href: "/" },
  { label: "فروشگاه", href: "/shop" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];

const categoryLinks = [
  { label: "کیک", href: "/categories/cakes" },
  { label: "شیرینی", href: "/categories/pastries" },
  { label: "نان", href: "/categories/breads" },
  { label: "شکلات", href: "/categories/chocolates" },
];

const supportLinks = [
  { label: "سبد خرید", href: "/cart" },
  { label: "پیگیری سفارش", href: "/orders" },
  { label: "سوالات متداول", href: "/faq" },
  { label: "قوانین و مقررات", href: "/terms" },
];

const TELEGRAM_URL = "https:" + "//t.me/qandak";
const INSTAGRAM_URL = "https:" + "//instagram.com/qandak";


function SocialIcon({
  href,
  label,
  variant,
  path,
}: {
  href: string;
  label: string;
  variant: "telegram" | "instagram";
  path: string;
}) {
  const fillBg =
    variant === "telegram"
      ? "bg-gradient-to-b from-[#37bbfe] to-[#007dbb]"
      : "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-md transition-transform duration-500 hover:-translate-y-1.5 hover:scale-110"
    >
      {/* لایه رنگی که از پایین پر می‌شه */}
      <span
        className={`absolute inset-x-0 bottom-0 h-0 ${fillBg} transition-all duration-500 ease-out group-hover:h-full`}
      />

      <svg
        viewBox="0 0 24 24"
        className="relative z-10 h-6 w-6 fill-cocoa/50 transition-colors duration-300 group-hover:fill-white"
      >
        <path d={path} />
      </svg>
    </Link>
  );
}    

const TELEGRAM_PATH =
  "M21.94 4.3 18.9 19.14c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.95.46l.34-4.8 8.73-7.9c.38-.34-.08-.53-.59-.2L6.98 13.2l-4.65-1.45c-1.01-.32-1.03-1.01.21-1.5l18.18-7.01c.84-.31 1.58.2 1.22 1.06Z";

const INSTAGRAM_PATH =
  "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.73 3.73 0 0 1-1.38-.9 3.73 3.73 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.98c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07Zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98Zm0 7.4a2.91 2.91 0 1 0 0-5.82 2.91 2.91 0 0 0 0 5.82Zm5.72-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z";

export default function Footer() {
  return (
    <footer className="relative  bg-gradient-to-b from-qandek-cream to-qandek-pink/25">
      {/* موج بالای فوتر - هم‌تراز و تمام عرض */}
      <div
        className="absolute inset-x-0 -top-px w-full leading-[0]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="block h-[50px] w-full sm:h-[70px] lg:h-[90px]"
        >
          <path
            d="M0,40 C180,90 360,0 540,30 C720,60 900,85 1080,55 C1260,25 1350,10 1440,35 L1440,0 L0,0 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* محتوای فوتر */}
      <Container>
        <div className="relative z-10 pb-32 pt-24 sm:pb-40 sm:pt-28 lg:pb-44 lg:pt-32">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* ستون ۱: معرفی + سوشال */}
            <div className="relative lg:pl-8">
              <h3 className="mb-4 text-xl font-bold text-qandek-strawberry">
                قندک
              </h3>
              <p className="text-sm leading-7 text-cocoa/75">
                شیرینی‌سرای قندک با بیش از ده سال تجربه، تولیدکننده انواع کیک،
                شیرینی، نان و شکلات دست‌ساز
              </p>

              {/* آیکون‌های سوشال */}
              <div className="mt-6 flex items-center gap-4">
                <SocialIcon
                  href={TELEGRAM_URL}
                  label="تلگرام قندک"
                  variant="telegram"
                  path={TELEGRAM_PATH}
                />
                <SocialIcon
                  href={INSTAGRAM_URL}
                  label="اینستاگرام قندک"
                  variant="instagram"
                  path={INSTAGRAM_PATH}
                />
              </div>

              {/* جداکننده خط‌چین عمودی */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 hidden border-l-2 border-dashed border-qandek-peach/50 lg:block"
              />
            </div>

            {/* ستون ۲: دسترسی سریع */}
            <div className="relative lg:pl-8">
              <h4 className="mb-4 text-sm font-bold text-cocoa">دسترسی سریع</h4>
              <ul className="flex flex-col gap-2.5 text-sm text-cocoa/75">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block transition-all hover:-translate-x-1 hover:text-qandek-strawberry"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 hidden border-l-2 border-dashed border-qandek-peach/50 lg:block"
              />
            </div>

            {/* ستون ۳: دسته‌بندی‌ها */}
            <div className="relative lg:pl-8">
              <h4 className="mb-4 text-sm font-bold text-cocoa">
                دسته‌بندی‌ها
              </h4>
              <ul className="flex flex-col gap-2.5 text-sm text-cocoa/75">
                {categoryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block transition-all hover:-translate-x-1 hover:text-qandek-strawberry"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 hidden border-l-2 border-dashed border-qandek-peach/50 lg:block"
              />
            </div>

            {/* ستون ۴: پشتیبانی و تماس */}
            <div>
              <h4 className="mb-4 text-sm font-bold text-cocoa">پشتیبانی</h4>
              <ul className="mb-5 flex flex-col gap-2.5 text-sm text-cocoa/75">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block transition-all hover:-translate-x-1 hover:text-qandek-strawberry"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-2 border-t-2 border-dashed border-qandek-peach/50 pt-4 text-sm text-cocoa/75">
                <li>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
                <li>آدرس: تهران، خیابان ولیعصر</li>
              </ul>
            </div>
          </div>

            {/* کپی‌رایت */}
          <div className="absolute inset-x-0 bottom-6 z-10 text-center text-sm text-cocoa/60 sm:bottom-8 lg:bottom-10">
            <p>&copy; {new Date().getFullYear()} قندک. تمامی حقوق محفوظ است.</p>
          </div>
        </div>
      </Container>

      {/* عکس‌های تزئینی لبه پایین */}
      <img
        src="/images/decor/footer-left.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 w-40 select-none opacity-90 sm:w-56 lg:w-72"
      />
      <img
        src="/images/decor/footer-right.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 z-0 w-40 select-none opacity-90 sm:w-56 lg:w-72"
      />
    </footer>
  );
}
