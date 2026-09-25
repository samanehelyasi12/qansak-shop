import { Metadata } from "next";
import Container from "@/components/ui/Container";
import { Leaf, Gift, Truck, Heart, Star, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "شیرینی‌سرای قندک با بیش از ۱۰ سال تجربه در تولید کیک، شیرینی، نان و شکلات دست‌ساز",
};

const steps = [
  {
    icon: Leaf,
    label: "انتخاب مواد",
    desc: "بهترین مواد اولیه طبیعی",
  },
  {
    icon: Heart,
    label: "تولید با عشق",
    desc: "دست‌ساز توسط تیم ماهر",
  },
  {
    icon: Gift,
    label: "بسته‌بندی شیک",
    desc: "ظاهری زیبا و خاص",
  },
  {
    icon: Truck,
    label: "ارسال سریع",
    desc: "تحویل در کمتر از ۳ ساعت",
  },
];

const stats = [
  { icon: Star, value: "۱۰+", label: "سال تجربه" },
  { icon: Clock, value: "۲۴/۷", label: "پشتیبانی" },
  { icon: Heart, value: "۵۰۰۰+", label: "مشتری راضی" },
];

export default function AboutPage() {
  return (
    <div dir="rtl" className="py-10 sm:py-16">
      <Container>
        {/* بخش اول: عکس + متن */}
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-14">
          {/* عکس - سمت راست */}
          <div className="w-full shrink-0 lg:w-2/5">
            <div className="overflow-hidden">
              <img
                src="/images/decor/about-us.webp"
                alt="قندک - شیرینی‌سرا"
                className="relative -top-12 w-full object-cover"
              />
            </div>
          </div>

          {/* متن - سمت چپ */}
          <div className=" w-full space-y-6 lg:w-3/5">
            <div>
              <span className="mb-2 inline-block rounded-full bg-berry/10 px-4 py-1 text-xs font-medium text-berry sm:text-sm">
                داستان ما
              </span>

              <h1 className="mb-3 text-2xl font-bold text-cocoa sm:text-3xl lg:text-4xl">
                از قندک چه می‌دانید؟
              </h1>

              <p className="text-sm leading-7 text-cocoa/70 sm:text-base">
                شیرینی‌سرای قندک در سال ۱۳۹۳ با هدف ارائه شیرینی‌های باکیفیت،
                تازه و دست‌ساز آغاز به کار کرد. از روز اول تا امروز، اصل بنیادین
                ما استفاده از بهترین مواد اولیه، تولید روزانه و تازه و حفظ اصالت
                طعم‌های سنتی در کنار نوآوری است.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-caramel sm:text-xl">
                مواد اولیه
              </h2>

              <p className="text-sm leading-7 text-cocoa/70 sm:text-base">
                تمام محصولات با کره حیوانی طبیعی، شکلات بلژیکی درجه یک، میوه‌های
                فصلی تازه و طعم‌های طبیعی تهیه می‌شوند — هیچ مواد نگهدارنده‌ای
                در کار نیست.
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-caramel sm:text-xl">
                تیم ما
              </h2>

              <p className="text-sm leading-7 text-cocoa/70 sm:text-base">
                پشت هر کیک و شیرینی، دست‌های ماهر و دل‌های پرشور تیم قندک است.
                هر روز با دقت و عشق محصولاتی خلق می‌کنیم که نه تنها خوشمزه، بلکه
                زیبا و خاص هستند.
              </p>
            </div>

            {/* آمار */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-2xl bg-qandek-cream px-4 py-3 shadow-sm"
                  >
                    <Icon
                      className="h-5 w-5 shrink-0 text-berry"
                      strokeWidth={1.5}
                    />

                    <div>
                      <p className="text-base font-bold text-cocoa sm:text-lg">
                        {stat.value}
                      </p>

                      <p className="text-xs text-cocoa/60">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* بخش دوم: مسیر تولید با خط‌چین هلالی */}
        <div className="mt-20 text-center">
          <span className="mb-2 inline-block rounded-full bg-berry/10 px-4 py-1 text-xs font-medium text-berry sm:text-sm">
            مسیر ما
          </span>

          <h2 className="mb-12 text-xl font-bold text-cocoa sm:text-2xl lg:text-3xl">
            از مزرعه تا سفره شما
          </h2>

          {/* مسیر مراحل */}
          <div className="relative flex flex-col items-center sm:flex-row sm:items-start sm:justify-between">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;

              return (
                <div
                  key={step.label}
                  className="relative flex w-full flex-col items-center sm:w-1/4"
                >
                  {/* آیکون */}
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-berry/20 sm:h-[72px] sm:w-[72px]">
                    <Icon className="h-7 w-7 text-berry" strokeWidth={1.5} />
                  </div>

                  {/* شماره */}
                  <span className="mt-1 text-xs font-bold text-berry/60">
                    {["۱", "۲", "۳", "۴"][i]}
                  </span>

                  {/* عنوان */}
                  <p className="mt-2 text-sm font-bold text-cocoa">
                    {step.label}
                  </p>

                  {/* توضیحات */}
                  <p className="mt-1 max-w-[120px] text-center text-xs text-cocoa/60">
                    {step.desc}
                  </p>

                  {/* -------------------------------- */}
                  {/* اتصال مرحله بعد */}
                  {/* -------------------------------- */}

                  {/* دسکتاپ / تبلت */}
                  {!isLast && (
                    <div className="pointer-events-none absolute top-[20px] left-[calc(-50%+36px)] hidden h-[36px] w-[calc(100%-72px)] sm:block">
                      <svg
                        viewBox="0 0 100 36"
                        fill="none"
                        className="h-full w-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        {/* خط‌چین هلالی */}
                        <path
                          d="M98 18 C 75 2, 25 2, 2 18"
                          stroke="#E85D75"
                          strokeWidth="1.8"
                          strokeDasharray="4 5"
                          strokeLinecap="round"
                          fill="none"
                        />

                        {/* فلش */}
                        <path
                          d="M7 11 L2 16 L7 21"
                          stroke="#E85D75"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}

                  {/* موبایل */}
                  {!isLast && (
                    <div className="flex h-10 w-full items-center justify-center sm:hidden">
                      <svg viewBox="0 0 20 40" className="h-10 w-5" fill="none">
                        {/* خط‌چین عمودی/هلالی */}
                        <path
                          d="M10 2 C 3 10, 17 20, 10 29"
                          stroke="#E85D75"
                          strokeWidth="1.8"
                          strokeDasharray="4 5"
                          strokeLinecap="round"
                          fill="none"
                        />

                        {/* فلش */}
                        <path
                          d="M6 25 L10 30 L14 25"
                          stroke="#E85D75"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* بخش سوم: تعهدات */}
        <div className="mt-20 rounded-3xl bg-gradient-to-l from-berry/10 to-qandek-pink/10 p-6 sm:p-10">
          <h2 className="mb-6 text-center text-xl font-bold text-cocoa sm:text-2xl">
            تعهد ما به شما
          </h2>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "تولید روزانه و تازه با بهترین مواد اولیه",
              "عدم استفاده از مواد نگه‌دارنده و افزودنی‌های مصنوعی",
              "تحویل سریع و در زمان مقرر",
              "ضمانت رضایت مشتری با امکان جایگزینی",
              "پشتیبانی ۲۴ ساعته برای پاسخ به سوالات شما",
              "بسته‌بندی بهداشتی و زیبا برای هدیه",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl bg-white/60 px-4 py-3 text-sm text-cocoa/80 shadow-sm backdrop-blur-sm"
              >
                <span className="mt-0.5 shrink-0 text-berry">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}
