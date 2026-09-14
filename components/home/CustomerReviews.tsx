"use client";

import { Star } from "lucide-react";
import Container from "@/components/ui/Container";

const reviews = [
  {
    name: "فاطمه محمدی",
    date: "۱۴۰۳/۰۶/۱۰",
    avatar: "/images/avatars/user1.webp",
    rating: 5,
    text: "کیفیت عالی، قیمت مناسب و برخورد خیلی خوب ممنون از شما 💗",
  },
  {
    name: "نگار احمدی",
    date: "۱۴۰۳/۰۵/۲۲",
    avatar: "/images/avatars/user2.webp",
    rating: 5,
    text: "طعم شیرینی‌ها فوق‌العاده بود، بسته‌بندی هم خیلی شیک و تمیز 🩷",
  },
  {
    name: "امیر رضایی",
    date: "۱۴۰۳/۰۴/۱۸",
    avatar: "/images/avatars/user3.webp",
    rating: 4,
    text: "ارسال سریع و محصول تازه بود، حتماً دوباره سفارش می‌دم ✨",
  },
];

export default function CustomerReviews() {
  return (
    <section className="relative overflow-hidden bg-white py-14 sm:py-20">
      <Container>
        {/* هدر */}
        <div className="mb-10 flex items-center justify-center gap-2 text-center sm:mb-12">
          <h2 className="text-lg font-bold text-cocoa sm:text-xl lg:text-2xl">
            تجربه شیرین دیگران
          </h2>
          <img
            src="/images/decor/piping-bag.webp"
            alt=""
            aria-hidden="true"
            className="h-7 w-7 -translate-y-0.5 sm:h-8 sm:w-8"
          />
        </div>

        {/* کارت‌ها */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {reviews.map((item, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-[24px] border-2 border-dashed border-qandek-peach/60 bg-gradient-to-br from-qandek-cream via-white to-qandek-pink/20 p-5 sm:p-6"
            >
              {/* دایره‌های بلور تزئینی */}
              <div className="pointer-events-none absolute -bottom-6 left-6 h-16 w-16 rounded-full bg-qandek-pink/40 blur-xl" />
              <div className="pointer-events-none absolute -bottom-4 left-1/2 h-10 w-20 -translate-x-1/2 rounded-full bg-cocoa/5 blur-lg" />
              <div className="pointer-events-none absolute -right-4 top-8 h-10 w-10 rounded-full bg-qandek-peach/30 blur-lg" />

              {/* هدر کارت: آواتار + اسم + تاریخ + ستاره */}
              <div className="relative z-10 flex items-start gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-[3px] border-white shadow-sm sm:h-16 sm:w-16">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-cocoa sm:text-base">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-cocoa/50 sm:text-xs">
                    {item.date}
                  </p>
                  <div className="mt-1.5 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          i < item.rating
                            ? "fill-caramel text-caramel"
                            : "fill-cocoa/10 text-cocoa/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* متن نظر */}
              <p className="relative z-10 mt-4 text-center text-sm leading-7 text-cocoa/80 sm:text-[15px]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}