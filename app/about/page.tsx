import { Metadata } from "next";
import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "درباره ما | قندک",
  description: "شیرینی‌سرای قندک با بیش از ۱۰ سال تجربه در تولید کیک، شیرینی، نان و شکلات دست‌ساز",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <Container>
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="text-center">
            <h1 className="mb-4 text-3xl font-bold text-cocoa sm:text-4xl">درباره قندک</h1>
            <p className="text-lg text-cocoa/70">
              طعم اصالت و تازگی، در هر لقمه
            </p>
          </header>

          <article className="space-y-6 text-cocoa/80">
            <section>
              <h2 className="mb-3 text-2xl font-bold text-caramel">داستان ما</h2>
              <p>
                شیرینی‌سرای قندک در سال ۱۳۹۳ با هدف ارائه شیرینی‌های باکیفیت، تازه و دست‌ساز
                برای مردم تهران آغاز به کار کرد. از روز اول تا امروز، اصل بنیادین ما استفاده از
                بهترین مواد اولیه، تولید روزانه و تازه و حفظ اصالت طعم‌های سنتی در کنار
                نوآوری در طراحی و ترکیب‌بندی است.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-caramel">مواد اولیه</h2>
              <p>
                ما معتقدیم کیفیت محصول از کیفیت مواد اولیه آغاز می‌شود. تمام محصولات قندک با
                کره حیوانی طبیعی، شکلات بلژیکی درجه یک، میوه‌های فصلی تازه، آردهای مرغوب و
                طعم‌های طبیعی تهیه می‌شوند. هیچ‌گونه چربی هیدروژنه، اسانس مصنوعی یا
                مواد نگه‌دارنده در محصولات ما به کار نمی‌رود.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-caramel">تیم ما</h2>
              <p>
                پشت هر کیک و شیرینی، دست‌های ماهر و دل‌های پرشور تیم قندک است. مسئولان و
                شاگردان ما با سال‌ها تجربه در هنر پتیسری و شکلات‌سازی، هر روز با دقت و عشق
                محصولاتی را خلق می‌کنند که نه تنها خوشمزه، بلکه زیبا و خاص هستند.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-caramel">تعهد ما</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>تولید روزانه و تازه با بهترین مواد اولیه</li>
                <li>عدم استفاده از مواد نگه‌دارنده و افزودنی‌های مصنوعی</li>
                <li>تحویل سریع و در زمان مقرر</li>
                <li>ضمانت رضایت مشتری با امکان جایگزینی</li>
                <li>پشتیبانی ۲۴ ساعته برای پاسخ به سوالات شما</li>
              </ul>
            </section>
          </article>
        </div>
      </Container>
    </div>
  );
}