import { Metadata } from "next";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "تسویه حساب | قندک",
  description: "تکمیل خرید و پرداخت سفارش در شیرینی‌سرای قندک",
};

export default function CheckoutPage() {
  return (
    <div className="py-12">
      <Container>
        <h1 className="mb-8 text-2xl font-bold text-cocoa">تسویه حساب</h1>
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-6 rounded-xl border border-cream bg-white p-6">
            <h2 className="text-xl font-bold text-caramel">اطلاعات مشتری</h2>
            <form className="space-y-4" action="/checkout" method="POST">
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="firstName" label="نام" placeholder="علی" required />
                <Input name="lastName" label="نام خانوادگی" placeholder="محمدی" required />
              </div>
              <Input name="email" type="email" label="ایمیل" placeholder="email@example.com" required />
              <Input name="phone" type="tel" label="شماره تماس" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required />
              <div className="w-full">
                <label htmlFor="address" className="block mb-2 text-sm font-medium text-cocoa">
                  آدرس کامل
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="w-full px-4 py-2 border border-cream rounded-lg text-cocoa bg-white focus:outline-none focus:ring-2 focus:ring-caramel"
                  placeholder="آدرس دقیق تحویل را وارد کنید"
                  required
                ></textarea>
              </div>
              <Input name="postalCode" label="کد پستی" placeholder="۱۲۳۴۵۶۷۸۹۰" required />
            </form>
          </section>

          <section className="space-y-6 rounded-xl border border-cream bg-white p-6">
            <h2 className="text-xl font-bold text-caramel">روش تحویل</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="delivery" value="express" className="h-4 w-4 text-caramel" defaultChecked />
                <div>
                  <p className="font-medium text-cocoa">پیک سریع (۳ ساعت)</p>
                  <p className="text-sm text-cocoa/60">۳۰,۰۰۰ تومان - فقط تهران</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="delivery" value="standard" className="h-4 w-4 text-caramel" />
                <div>
                  <p className="font-medium text-cocoa">پست پیشتاز (۱-۲ روز)</p>
                  <p className="text-sm text-cocoa/60">۲۰,۰۰۰ تومان - سراسر ایران</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="delivery" value="pickup" className="h-4 w-4 text-caramel" />
                <div>
                  <p className="font-medium text-cocoa">تحویل حضوری از شعبه</p>
                  <p className="text-sm text-cocoa/60">رایگان - در ساعات کاری</p>
                </div>
              </label>
            </div>

            <div className="border-t border-cream pt-4">
              <h3 className="mb-4 font-bold text-cocoa">روش پرداخت</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment" value="online" className="h-4 w-4 text-caramel" defaultChecked />
                  <div>
                    <p className="font-medium text-cocoa">پرداخت آنلاین</p>
                    <p className="text-sm text-cocoa/60">کارت به کارت، درگاه بانکی، وش cân</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment" value="card" className="h-4 w-4 text-caramel" />
                  <div>
                    <p className="font-medium text-cocoa">پرداخت در محل (کارت)</p>
                    <p className="text-sm text-cocoa/60">فقط برای تحویل حضوری و پیک</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment" value="cash" className="h-4 w-4 text-caramel" />
                  <div>
                    <p className="font-medium text-cocoa">پرداخت نقدی در محل</p>
                    <p className="text-sm text-cocoa/60">فقط برای تحویل حضوری</p>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 space-y-4 rounded-xl border border-cream bg-white p-6">
          <h2 className="text-xl font-bold text-caramel">خلاصه سفارش</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-cocoa/70">کیک ترافل شکلاتی × ۱</dt>
              <dd className="font-medium text-cocoa">۷۶۰,۰۰۰ تومان</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cocoa/70">نان خامه‌ای × ۳</dt>
              <dd className="font-medium text-cocoa">۱۳۵,۰۰۰ تومان</dd>
            </div>
            <div className="border-t border-cream pt-3 flex justify-between text-lg font-bold text-cocoa">
              <dt>مجموع (شامل ارسال)</dt>
              <dd className="text-caramel">۹۲۵,۰۰۰ تومان</dd>
            </div>
          </dl>
          <Button size="lg" className="w-full mt-6">
            ثبت سفارش و پرداخت
          </Button>
        </section>
      </Container>
    </div>
  );
}