import Link from "next/link";
import Image from "next/image";
import CakeCarousel from "./CakeCarousel";
import HeaderDrip from "../layout/HeaderDrip";

export default function Hero() {
  return (
    <section dir="rtl" className="relative bg-slate-50">
      {/* ===================== نسخه دسکتاپ (lg به بالا) - دقیقاً کد اصلی خودت ===================== */}
      <div className="mx-auto hidden max-w-7xl flex-col items-center gap-10 px-6 py-16 lg:flex lg:flex-row lg:py-19">
        {/* Text column — سمت راست */}
        <div className="relative w-full lg:w-1/2">
          <svg
            className="absolute -right-2 top-24 h-6 w-6 text-berry/60 mr-[380px] mt-[-50px]  animate-fade-up [animation-delay:0.1s]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 21s-7.5-4.6-10-9.3C.5 8.1 2.3 4.5 6 4a5 5 0 0 1 6 2.5A5 5 0 0 1 18 4c3.7.5 5.5 4.1 4 7.7-2.5 4.7-10 9.3-10 9.3Z" />
          </svg>

          <h1 className="text-4xl font-bold leading-tight text-cocoa sm:text-5xl animate-fade-up [animation-delay:0.15s]">
            <span className="relative inline-block mr-[180px] mb-2 text-3xl">
              هر روز، یک
            </span>
            <br />
            <span className="text-berry mr-[120px] text-1xl ">تکه خوشحالی</span>
          </h1>
          <Image
            src="/images/products/khat.webp"
            alt=""
            width={60}
            height={60}
            sizes="60px"
            className="mt-[-120px] absolute mr-[130px] animate-fade-up [animation-delay:0.35s]"
          />

          <div className="mt-4 flex items-center gap-3 animate-fade-up [animation-delay:0.3s]">
            <Image
              src="/images/products/heart.webp"
              alt=""
              width={180}
              height={180}
              className="mr-40"
            />
          </div>

          <p className="mt-4 mr-[100px] max-w-md text-base leading-8 text-cocoa/70 animate-fade-up [animation-delay:0.4s]">
            شیرینی‌های خوش‌طعم و تازه با بهترین مواد اولیه
            <br />
            <span className="mr-[50px]"> سفارش آنلاین، لذت همیشه</span>
          </p>

          <div className="mt-8 mr-[160px] flex items-center gap-2 animate-fade-up [animation-delay:0.5s]">
            <span className="text-lg font-bold text-berry">سفارش دهید</span>

            <svg
              width="56"
              height="20"
              viewBox="0 0 56 20"
              fill="none"
              className="shrink-0 text-berry/70"
            >
              <path
                d="M54 10 H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
              <path
                d="M22 4 L14 10 L22 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>

            <Link href="/products" aria-label="مشاهده همه محصولات">
              <Image
                src="/images/hero/order-badge.webp"
                alt="مشاهده همه محصولات"
                width={1254}
                height={1254}
                sizes="80px"
                className="h-16 w-16 origin-bottom animate-wiggle sm:h-20 sm:w-20"
              />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-cocoa/80 animate-fade-up [animation-delay:0.6s]">
            <div className="flex items-center gap-2 border border-dashed border-berry/90 rounded-full px-4 py-2">
              <span>مواد اولیه تازه</span>
              <svg
                className="h-5 w-5 text-pistachio"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 21c-4-1-8-5-8-11 5 0 9 2 10 6" />
                <path d="M12 21c4-1 8-5 8-11-5 0-9 2-10 6" />
              </svg>
            </div>
            <div className="flex items-center gap-2 border border-dashed border-berry/90 rounded-full px-4 py-2">
              <span>ارسال سریع</span>
              <svg
                className="h-5 w-5 text-caramel"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="1" y="7" width="13" height="9" rx="1.5" />
                <path d="M14 10h4l3 3v3h-7z" />
                <circle cx="6" cy="18.5" r="1.5" />
                <circle cx="17" cy="18.5" r="1.5" />
              </svg>
            </div>
            <div className="flex items-center gap-2 border border-dashed border-berry/90 rounded-full px-4 py-2">
              <span>بسته‌بندی شیک</span>
              <svg
                className="h-5 w-5 text-qandek-strawberry"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="8" width="18" height="13" rx="1.5" />
                <path d="M3 12h18M12 8v13" />
                <path d="M8 8a2.5 2.5 0 0 1 0-5c2 0 4 2 4 5M16 8a2.5 2.5 0 0 0 0-5c-2 0-4 2-4 5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Image column — سمت چپ */}
        <div className="relative w-full lg:w-1/2 animate-fade-scale [animation-delay:0.2s]">
          <div className="relative mx-auto aspect-square max-w-md">
            <div className="absolute inset-0 scale-110 rounded-[45%_55%_60%_40%/55%_45%_55%_45%] bg-pink-100" />
            <CakeCarousel />
          </div>
        </div>
      </div>

      {/* ===================== نسخه موبایل و تبلت (زیر lg) ===================== */}
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center lg:hidden">
        <div className="relative w-full max-w-sm animate-fade-scale [animation-delay:0.2s]">
          <div className="relative mx-auto aspect-square w-full">
            <div className="absolute inset-0 scale-110 rounded-[45%_55%_60%_40%/55%_45%_55%_45%] bg-pink-100" />
            <CakeCarousel />
          </div>
        </div>

        {/* تیتر با علامت‌های تزئینی بالای گوشه‌ها */}
        <div className="relative  mt-5 animate-fade-up [animation-delay:0.15s]">
          <Image
            src="/images/products/khat.webp"
            alt=""
            width={40}
            height={40}
            sizes="40px"
            className="absolute -top-3 -right-2 h-7 w-7"
          />
          <svg
            className="absolute -mt-[-27px] -left-4 h-5 w-5 text-berry/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 21s-7.5-4.6-10-9.3C.5 8.1 2.3 4.5 6 4a5 5 0 0 1 6 2.5A5 5 0 0 1 18 4c3.7.5 5.5 4.1 4 7.7-2.5 4.7-10 9.3-10 9.3Z" />
          </svg>

          <h1 className="text-3xl font-bold leading-tight text-cocoa sm:text-4xl">
            هر روز، یک
            <br />
            <span className="text-berry">تکه خوشحالی</span>
          </h1>
        </div>

        {/* خط موج‌دار قلبی، زیر تیتر */}
        <Image
          src="/images/products/heart.webp"
          alt=""
          width={140}
          height={40}
          className="h-12 w-auto animate-fade-up [animation-delay:0.3s]"
        />

        <p className="max-w-md text-sm leading-7 text-cocoa/70 animate-fade-up [animation-delay:0.4s] sm:text-base">
          شیرینی‌های خوش‌طعم و تازه با بهترین مواد اولیه
          <br />
          سفارش آنلاین، لذت همیشه
        </p>

        <div className="flex items-center gap-2 animate-fade-up [animation-delay:0.5s]">
          <span className="text-base font-bold text-berry sm:text-lg">
            سفارش دهید
          </span>
          <svg
            width="56"
            height="20"
            viewBox="0 0 56 20"
            fill="none"
            className="shrink-0 text-berry/70"
          >
            <path
              d="M54 10 H16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
            <path
              d="M22 4 L14 10 L22 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <Link href="/products" aria-label="مشاهده همه محصولات">
            <Image
              src="/images/hero/order-badge.webp"
              alt="مشاهده همه محصولات"
              width={1254}
              height={1254}
              sizes="64px"
              className="h-14 w-14 origin-bottom animate-wiggle sm:h-16 sm:w-16"
            />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-cocoa/80 animate-fade-up [animation-delay:0.6s] sm:text-sm">
          <div className="flex items-center gap-2 rounded-full border border-dashed border-berry/90 px-3 py-1.5 sm:px-4 sm:py-2">
            <span>مواد اولیه تازه</span>
            <svg
              className="h-4 w-4 text-pistachio sm:h-5 sm:w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 21c-4-1-8-5-8-11 5 0 9 2 10 6" />
              <path d="M12 21c4-1 8-5 8-11-5 0-9 2-10 6" />
            </svg>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-dashed border-berry/90 px-3 py-1.5 sm:px-4 sm:py-2">
            <span>ارسال سریع</span>
            <svg
              className="h-4 w-4 text-caramel sm:h-5 sm:w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="1" y="7" width="13" height="9" rx="1.5" />
              <path d="M14 10h4l3 3v3h-7z" />
              <circle cx="6" cy="18.5" r="1.5" />
              <circle cx="17" cy="18.5" r="1.5" />
            </svg>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-dashed border-berry/90 px-3 py-1.5 sm:px-4 sm:py-2">
            <span>بسته‌بندی شیک</span>
            <svg
              className="h-4 w-4 text-qandek-strawberry sm:h-5 sm:w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="8" width="18" height="13" rx="1.5" />
              <path d="M3 12h18M12 8v13" />
              <path d="M8 8a2.5 2.5 0 0 1 0-5c2 0 4 2 4 5M16 8a2.5 2.5 0 0 0 0-5c-2 0-4 2-4 5" />
            </svg>
          </div>
        </div>
      </div>

      <HeaderDrip />
    </section>
  );
}
