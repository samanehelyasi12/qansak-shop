import Link from "next/link";
import { Leaf, Gift, Heart, Bike } from "lucide-react";

const rules = [
  {
    icon: Leaf,
    title: "مواد اولیه تازه و طبیعی",
    color: "text-pistachio",
    bg: "bg-pistachio/10",
  },
  {
    icon: Gift,
    title: "بدون مواد نگهدارنده",
    color: "text-purple-400",
    bg: "bg-purple-100",
  },
  {
    icon: Heart,
    title: "دستساز با عشق",
    color: "text-berry",
    bg: "bg-berry/10",
  },
  {
    icon: Bike,
    title: "ارسال سریع و مطمئن",
    color: "text-caramel",
    bg: "bg-caramel/10",
  },
];

export default function Rules() {
  return (
    <section
      dir="rtl"
      className="relative overflow-hidden py-20 sm:py-28"
      aria-labelledby="rules-title"
    >
      {/* ===== بک‌گراند سه‌بعدی ===== */}
      {/* لایه‌ی اصلی گرادیانت */}
      <div className="absolute inset-0 bg-gradient-to-bl from-qandek-pink via-pink-100 to-qandek-cream" />

      {/* دایره‌های تزئینی سه‌بعدی */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-berry/20 to-qandek-pink/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-80 w-80 rounded-full bg-gradient-to-tr from-pink-200/60 to-qandek-peach/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-2xl" />

      {/* نقاط تزئینی */}
      <div className="pointer-events-none absolute right-[15%] top-10 h-3 w-3 rounded-full bg-berry/30" />
      <div className="pointer-events-none absolute right-[30%] top-16 h-2 w-2 rounded-full bg-caramel/40" />
      <div className="pointer-events-none absolute left-[20%] top-8 h-2 w-2 rounded-full bg-berry/20" />
      <div className="pointer-events-none absolute left-[10%] bottom-16 h-3 w-3 rounded-full bg-pistachio/30" />
      <div className="pointer-events-none absolute right-[8%] bottom-10 h-2 w-2 rounded-full bg-caramel/30" />

      {/* ===== محتوا ===== */}
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-6">

          {/* متن - سمت راست */}
          <div className="w-full text-center lg:w-[30%] lg:text-right">
            <span className="mb-3 inline-block rounded-full bg-white/60 px-4 py-1 text-xs font-medium text-berry backdrop-blur-sm sm:text-sm">
              چرا قندک؟
            </span>
            <h2
              id="rules-title"
              className="mb-4 text-2xl font-bold leading-snug text-cocoa sm:text-3xl lg:text-4xl"
            >
              طعم عشق را
              <br />
              در قندک تجربه کنید
            </h2>
            <p className="mb-6 text-xs leading-7 text-cocoa/70 sm:text-sm lg:text-base">
              ما در قندک با انتخاب بهترین مواد اولیه و دستورهای ویژه،
              شیرینی‌هایی درست می‌کنیم که لبخند را به لحظاتتان می‌آورند.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full bg-berry px-5 py-2.5 text-xs font-bold text-white transition hover:bg-berry/90 sm:text-sm"
            >
              درباره ما بیشتر بدانید
            </Link>
          </div>

          {/* عکس - وسط */}
          <div className="relative w-full lg:w-[36%]">
            {/* حلقه‌ی درخشان پشت عکس */}
            <div className="absolute inset-0 mx-auto my-auto h-[80%] w-[80%] translate-x-[10%] rounded-full bg-gradient-to-br from-white/80 via-pink-100/60 to-qandek-peach/40 blur-2xl" />
            {/* سایه‌ی کف */}
            <div className="absolute bottom-0 left-1/2 h-8 w-[55%] -translate-x-1/2 rounded-full bg-berry/15 blur-xl" />
            <img
              src="/images/decor/strawberry-cup.webp"
              alt="توت فرنگی تازه در فنجان صورتی"
              className="relative z-10 mx-auto w-[75%] drop-shadow-2xl transition-transform duration-700 hover:scale-105 sm:w-[65%] lg:w-[85%]"
            />
          </div>

          {/* آیکون‌ها - سمت چپ */}
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:w-[30%] lg:grid-cols-1">
            {rules.map((rule) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-md backdrop-blur-sm transition hover:bg-white/70 hover:shadow-lg"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${rule.bg} shadow-sm`}
                  >
                    <Icon className={`h-5 w-5 ${rule.color}`} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium leading-5 text-cocoa sm:text-sm">
                    {rule.title}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}