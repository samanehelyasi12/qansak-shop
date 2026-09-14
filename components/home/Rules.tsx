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
    <section className="px-1 py-3 sm:px-3 sm:py-8 lg:px-4" aria-labelledby="rules-title">
      <div className="relative mx-auto max-w-screen-2xl overflow-hidden rounded-3xl">
        {/* عکس بک‌گراند - عرض و ارتفاع کامل کارت، با نسبت ابعاد ثابت */}
        <img
          src="/images/decor/why-qandak.webp"
          alt=""
          aria-hidden="true"
          className="h-full min-h-[220px] w-full object-cover sm:min-h-[260px]"
        />

        {/* محتوا روی عکس */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Container>
            <div className="flex flex-col items-center gap-6 lg:flex-row-reverse lg:items-center lg:justify-center lg:gap-16">
              {/* متن - سمت راست */}
              <div className="w-full max-w-xs mr-[890px] absolute text-center lg:text-right">
                <h2 id="rules-title" className="text-xl font-bold leading-snug text-cocoa sm:text-2xl lg:text-3xl">
                  طعم عشق را
                  <br />
                  در قندک تجربه کنید
                </h2>
                <p className="mt-3 hidden text-sm leading-7 text-cocoa/70 sm:block">
                  ما در قندک با انتخاب بهترین مواد اولیه و دستورهای ویژه شیرینی‌هایی درست می‌کنیم که به لحظاتتان می‌آورند
                </p>
                <Link
                  href="/about"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-berry px-5 py-2.5 text-xs font-bold text-white transition hover:bg-berry/90 sm:text-sm"
                >
                  درباره ما بیشتر بدانید
                </Link>
              </div>

              {/* کارت‌های آیکون - سمت چپ */}
              <div className="hidden gap-3 sm:flex ml-[900px] absolute sm:gap-4">
                {rules.map((rule) => {
                  const Icon = rule.icon;
                  return (
                    <div
                      key={rule.title}
                      className="flex w-20 flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 p-3 text-center shadow-sm backdrop-blur-sm sm:w-24 sm:p-4"
                    >
                      <Icon className="h-6 w-6 text-berry sm:h-7 sm:w-7" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium leading-4 text-cocoa sm:text-xs">
                        {rule.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}