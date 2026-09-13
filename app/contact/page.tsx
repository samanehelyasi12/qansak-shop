import { Metadata } from "next";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "تماس با ما | قندک",
  description: "ارتباط با شیرینی‌سرای قندک - آدرس، تلفن و فرم تماس",
};

const contactItems = [
  {
    title: "آدرس",
    text: "تهران، خیابان ولیعصر، نبش کوچه بهار، پلاک ۱۲۳",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    title: "تلفن",
    text: "۰۲۱-۱۲۳۴۵۶۷۸ (داخلی ۱ برای سفارش، داخلی ۲ برای پشتیبانی)",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
  {
    title: "ایمیل",
    text: "info@ghandak.ir",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: "ساعات کاری",
    text: "شنبه تا چهارشنبه: ۸ صبح تا ۱۰ شب\nپنج‌شنبه و جمعه: ۹ صبح تا ۱۱ شب",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="py-16">
      <Container>
        <div className="mx-auto max-w-3xl space-y-10">
          <header className="text-center">
            <h1 className="mb-4 text-3xl font-bold text-cocoa sm:text-4xl">تماس با ما</h1>
            <p className="text-lg text-cocoa/70">ما اینجاییم تا به شما کمک کنیم</p>
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-qandek-strawberry">اطلاعات تماس</h2>
              <div className="space-y-4">
                {contactItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-qandek-pink/30 text-qandek-strawberry">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="font-medium text-cocoa">{item.title}</h3>
                      <p className="whitespace-pre-line text-sm text-cocoa/70">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form className="space-y-4" action="/contact" method="POST">
              <h2 className="text-xl font-bold text-qandek-strawberry">فرم تماس</h2>
              <Input
                name="name"
                label="نام و نام خانوادگی"
                placeholder="مثال: علی محمدی"
                required
              />
              <Input
                name="email"
                type="email"
                label="ایمیل"
                placeholder="example@email.com"
                required
              />
              <Input
                name="phone"
                type="tel"
                label="شماره تماس"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              />
              <div className="w-full">
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-cocoa">
                  پیام
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-lg border border-cream bg-white px-4 py-2 text-cocoa focus:outline-none focus:ring-2 focus:ring-qandek-peach"
                  placeholder="پیام خود را اینجا بنویسید..."
                  required
                ></textarea>
              </div>
              <Button type="submit" size="lg" className="w-full">
                ارسال پیام
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}