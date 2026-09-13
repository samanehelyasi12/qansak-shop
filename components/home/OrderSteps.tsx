import Container from "@/components/ui/Container";

const steps = [
  {
    number: "۰۱",
    title: "انتخاب محصول",
    description: "از بین دسته‌بندی‌های متنوع کیک، شیرینی، نان و شکلات محصول دلخواهت رو انتخاب کن",
  },
  {
    number: "۰۲",
    title: "سفارش و پرداخت",
    description: "اطلاعات تحویل رو تکمیل کن و با درگاه‌های امن آنلاین پرداخت کن",
  },
  {
    number: "۰۳",
    title: "تهیه تازه",
    description: "محصولات با بهترین مواد اولیه به‌صورت تازه و لحظه‌ای برای تو hazır میشن",
  },
  {
    number: "۰۴",
    title: "تحویل سریع",
    description: "سفارشت در کمترین زمان ممکن با موتور پیک به درت می‌رسه",
  },
];

export default function OrderSteps() {
  return (
    <section className="py-16 bg-white" aria-labelledby="order-steps-title">
      <Container>
        <div className="mb-12 text-center">
          <h2 id="order-steps-title" className="text-2xl font-bold text-cocoa sm:text-3xl">
            چطور کار می‌کنه؟
          </h2>
          <p className="mt-2 text-sm text-cocoa/70">
            فرآیند سفارش در قندک ساده و سریع است
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.number}
              className="relative text-center p-6 rounded-xl bg-cream/50 border border-cream"
            >
              <span className="mb-4 block text-4xl font-bold text-caramel/50">
                {step.number}
              </span>
              <h3 className="mb-2 font-bold text-cocoa">{step.title}</h3>
              <p className="text-sm text-cocoa/70">{step.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}