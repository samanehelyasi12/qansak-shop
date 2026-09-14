import Image from "next/image";
import Container from "@/components/ui/Container";

const faqs = [
  {
    question: "زمان تحویل سفارش چقدر است؟",
    answer:
      "سفارشات در محدوده تهران معمولاً در کمتر از ۳ ساعت تحویل داده می‌شوند. برای سایر شهرها، ۱ تا ۲ روز کاری طول می‌کشد.",
  },
  {
    question: "آیا می‌توانم سفارشم را لغو کنم؟",
    answer:
      "بله، تا ۱ ساعت بعد از ثبت سفارش می‌توانید بدون هیچ هزینه‌ای سفارش خود را لغو کنید. پس از تهیه، لغو امکان‌پذیر نیست.",
  },
  {
    question: "محصولات با چه مواد اولیه‌ای تهیه می‌شوند؟",
    answer:
      "تمامی محصولات قندک با بهترین مواد اولیه درجه یک، کره حیوانی طبیعی، شکلات بلژیکی و میوه‌های تازه تهیه می‌شوند.",
  },
  {
    question: "آیا بسته‌بندی کادویی دارید؟",
    answer:
      "بله، برای جعبه‌های شکلات و کیک‌های مناسبتی بسته‌بندی کادویی رایگان در نظر گرفته شده است.",
  },
  {
    question: "شرایط حفظ محصولات چگونه است؟",
    answer:
      "کیک‌ها و شیرینی‌های تر در یخچال (۴ تا ۸ درجه) نگهداری شوند. شیرینی‌های خشک و نان در دمای اتاق و دور از رطوبت.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="faq-title">
      <Container>
        <div
          className="
            grid
            grid-cols-1
            items-start
            gap-10
            md:grid-cols-2
            md:gap-16
          "
          dir="ltr"
        >
          {/* سمت چپ - تصویر جارکیک */}
          {/* سمت چپ - جارکیک */}
          <div className="relative flex h-[360px] items-start justify-center translate-y-16">
            <div className="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[360px] sm:w-[360px]">
              {/* بک‌گراند موج‌دار و نامنظم */}
              <div
                className="
        absolute
        inset-4
        bg-[#F8C8D8]
        opacity-70
        blur-[1px]
      "
                style={{
                  borderRadius: "58% 42% 66% 34% / 38% 58% 42% 62%",
                  transform: "rotate(-8deg)",
                }}
              />

              {/* جارکیک */}
              <div className="relative z-10 w-[220px] sm:w-[240px]">
                <Image
                  src="/images/decor/jar-cake.webp"
                  alt="جار کیک توت فرنگی"
                  width={600}
                  height={700}
                  className="
          h-auto
          w-full
          object-contain
          drop-shadow-[0_12px_18px_rgba(90,62,54,0.14)]
        "
                />
              </div>
            </div>
          </div>

          {/* سمت راست - سوالات */}
          <div dir="rtl">
            <div className="mb-8">
              <h2
                id="faq-title"
                className="text-2xl font-bold text-cocoa sm:text-3xl lg:text-4xl"
              >
                سوالات متداول
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-cocoa/65">
                پاسخ چند سؤال رایج درباره سفارش، ارسال و محصولات قندک
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="
    group
    overflow-hidden
    rounded-2xl
    border
    border-[#F3DDD6]
    bg-white
  "
                >
                  <summary
                    className="
      flex
      cursor-pointer
      list-none
      items-center
      justify-between
      gap-4
      px-5
      py-5
      font-medium
      text-cocoa
    "
                  >
                    <span>{faq.question}</span>

                    <span
                      className="ml-4 text-pink-300 transition-transform duration-300 group-open:rotate-180"
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </summary>

                  <div className="faq-answer">
                    <p className="px-5 pb-5 text-sm leading-7 text-cocoa/70">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
