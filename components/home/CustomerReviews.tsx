import Container from "@/components/ui/Container";

const reviews = [
  {
    id: 1,
    name: "زهرا محمدی",
    rating: 5,
    text: "کیک ترافل شکلاتی فوق‌العاده بود! تازه، خوشمزه و دقیقاً مثل عکس. قطعاً دوباره سفارش می‌دم.",
    date: "۱۴۰۳/۰۶/۱۵",
  },
  {
    id: 2,
    name: "احمد رضایی",
    rating: 5,
    text: "نان خامه‌ای صبح تحویل داده شد و هنوز داغ و تازه بود. کیفیت فوق‌العاده و قیمت مناسب.",
    date: "۱۴۰۳/۰۶/۱۰",
  },
  {
    id: 3,
    name: "مریم کریمی",
    rating: 4,
    text: "جعبه شکلات تلخ برای عید خریدم، بسته‌بندی خیلی شیک بود و شکلات‌ها دست‌ساز و بالا بودن. تشکر!",
    date: "۱۴۰۳/۰۵/۲۸",
  },
];

export default function CustomerReviews() {
  return (
    <section className="py-16 bg-cream/30" aria-labelledby="reviews-title">
      <Container>
        <div className="mb-12 text-center">
          <h2 id="reviews-title" className="text-2xl font-bold text-cocoa sm:text-3xl">
            نظرات مشتریان
          </h2>
          <p className="mt-2 text-sm text-cocoa/70">
            چی می‌گن از قندک؟
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl bg-white p-6 shadow-sm border border-cream"
            >
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={i < review.rating ? "text-caramel" : "text-cream"}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="mb-4 text-sm text-cocoa/80">{review.text}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-cocoa">{review.name}</p>
                  <p className="text-xs text-cocoa/50">{review.date}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}