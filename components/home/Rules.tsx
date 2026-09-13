import Container from "@/components/ui/Container";

const rules = [
  {
    icon: "🛡️",
    title: "ضمانت کیفیت",
    description: "تمامی محصولات با بهترین مواد اولیه و تحت نظارت کیفیت تهیه می‌شوند",
  },
  {
    icon: "🚚",
    title: "تحویل سریع",
    description: "سفارشات در محدوده تهران در کمتر از ۳ ساعت تحویل داده می‌شوند",
  },
  {
    icon: "🔄",
    title: "استبدال آسان",
    description: "در صورت عدم رضایت، تا ۲ ساعت بعد از تحویل قابل استبدال است",
  },
  {
    icon: "💬",
    title: "پشتیبانی ۲۴/۷",
    description: "تیم پشتیبانی ما در همه ساعات برای پاسخگویی به شما در دسترس است",
  },
];

export default function Rules() {
  return (
    <section className="py-16 bg-white" aria-labelledby="rules-title">
      <Container>
        <div className="mb-12 text-center">
          <h2 id="rules-title" className="text-2xl font-bold text-cocoa sm:text-3xl">
            چرا قندک؟
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {rules.map((rule) => (
            <article
              key={rule.title}
              className="text-center p-6 rounded-xl bg-cream/50 border border-cream"
            >
              <span className="mb-4 block text-4xl" role="img" aria-hidden="true">
                {rule.icon}
              </span>
              <h3 className="mb-2 font-bold text-cocoa">{rule.title}</h3>
              <p className="text-sm text-cocoa/70">{rule.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}