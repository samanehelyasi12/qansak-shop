import Link from "next/link";
import { Leaf, Gift, Heart, Bike } from "lucide-react";
import Container from "@/components/ui/Container";

const rules = [
  {
    icon: Leaf,
    title: "مواد اولیه تازه و طبیعی",
  },
  {
    icon: Gift,
    title: "بدون مواد نگهدارنده",
  },
  {
    icon: Heart,
    title: "دستساز با عشق",
  },
  {
    icon: Bike,
    title: "ارسال سریع و مطمئن",
  },
];

export default function Rules() {
  return (
    <section
      className="px-1 py-3 sm:px-3 sm:py-8 lg:px-4"
      aria-labelledby="rules-title"
    >
      <div className="relative mx-auto max-w-screen-2xl overflow-hidden rounded-3xl">
        {/* بک‌گراند اصلی */}
        <img
          src="/images/decor/why-qandak.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* محتوا */}
       <Container>
  <div className="relative z-10 flex min-h-[220px] items-center py-6 sm:min-h-[260px] sm:py-8 lg:min-h-[320px] lg:py-10">
    <div className="grid w-full grid-cols-2 items-center gap-2 sm:gap-5 lg:gap-12">

      {/* ================= متن - سمت راست ================= */}
      <div className="flex min-w-0 flex-col items-center justify-center text-center lg:items-start lg:text-right">
        <h2
          id="rules-title"
          className="text-[13px] font-bold leading-snug text-cocoa sm:text-lg md:text-2xl lg:text-3xl"
        >
          طعم عشق را
          <br />
          در قندک تجربه کنید
        </h2>

        <p className="mt-2 hidden max-w-xs text-[10px] leading-5 text-cocoa/70 sm:block sm:text-xs sm:leading-6 md:text-sm lg:mt-3 lg:leading-7">
          ما در قندک با انتخاب بهترین مواد اولیه و دستورهای ویژه شیرینی‌هایی
          درست می‌کنیم که به لحظاتتان می‌آورند
        </p>

        <Link
          href="/about"
          className="mt-2 inline-flex rounded-full bg-berry px-3 py-1.5 text-[9px] font-bold text-white transition hover:bg-berry/90 sm:mt-3 sm:px-4 sm:py-2 sm:text-xs md:px-5 md:py-2.5 md:text-sm lg:mt-4"
        >
          درباره ما بیشتر بدانید
        </Link>
      </div>

      {/* ================= آیکن‌ها - سمت چپ ================= */}
      <div className="flex min-w-0 items-center justify-start gap-1 sm:gap-2 lg:-translate-x-64 lg:gap-3">
        {rules.map((rule) => {
          const Icon = rule.icon;

          return (
            <div
              key={rule.title}
              className="flex h-16 min-w-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white/60 px-1.5 py-2 text-center shadow-sm backdrop-blur-sm sm:h-20 sm:min-w-0 sm:rounded-2xl sm:px-2 sm:py-2.5 md:h-24 md:px-2.5 lg:h-28 lg:w-24 lg:flex-none lg:px-3"
            >
              <Icon
                className="h-4 w-4 shrink-0 text-berry sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7"
                strokeWidth={1.5}
              />

              <span className="line-clamp-2 text-[7px] font-medium leading-3 text-cocoa sm:text-[8px] sm:leading-3 md:text-[10px] md:leading-4 lg:text-xs">
                {rule.title}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  </div>
</Container>
      </div>
    </section>
  );
}