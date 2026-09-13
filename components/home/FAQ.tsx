import Container from "@/components/ui/Container";

const faqs = [
  {
    question: "زمان تحویل سفارش چقدر است؟",
    answer: "سفارشات در محدوده تهران معمولاً در کمتر از ۳ ساعت تحویل داده می‌شوند. برای سایر شهرها، ۱ تا ۲ روز کاری طول می‌کشد.",
  },
  {
    question: "آیا می‌توانم سفارشم را لغو کنم؟",
    answer: "بله، تا ۱ ساعت بعد از ثبت سفارش می‌توانید بدون هیچ هزینه‌ای سفارش خود را لغو کنید. پس از تهیه، لغو امکان‌پذیر نیست.",
  },
  {
    question: "محصولات با چه مواد اولیه‌ای تهیه می‌شوند؟",
    answer: "تمامی محصولات قندک با بهترین مواد اولیه درجه یک، کره حیوانی طبیعی، شکلات بلژیکی و میوه‌های تازه تهیه می‌شوند.",
  },
  {
    question: "آیا بسته‌بندی کادویی دارید؟",
    answer: "بله، برای جعبه‌های شکلات و کیک‌های مناسبتی بسته‌بندی کادویی رایگان در نظر گرفته شده است.",
  },
  {
    question: "شرایط حفظ محصولات چگونه است؟",
    answer: "کیک‌ها و شیرینی‌های تر در یخچال (۴ تا ۸ درجه) نگهداری شوند. شیرینی‌های خشک و نان در دمای اتاق و دور از رطوبت.",
  },
];

export default function FAQ() {
  return (
    <section className="py-16 bg-cream/30" aria-labelledby="faq-title">
      <Container>
        <div className="mb-12 text-center">
          <h2 id="faq-title" className="text-2xl font-bold text-cocoa sm:text-3xl">
            سوالات متداول
          </h2>
          <p className="mt-2 text-sm text-cocoa/70">
            پاسخ سوالات رایج مشتریان
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group rounded-xl bg-white p-6 border border-cream"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-cocoa">
                {faq.question}
                <span className="ml-4 text-caramel transition-transform group-open:rotate-180" aria-hidden="true">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-sm text-cocoa/70">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}