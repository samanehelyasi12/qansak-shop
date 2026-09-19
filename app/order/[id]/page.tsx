import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

const mockOrders: Record<string, any> = {
  "ORD-12345": {
    id: "ORD-12345",
    date: "۱۴۰۳/۰۶/۱۵",
    status: "delivered",
    statusLabel: "تحویل داده شده",
    statusColor: "text-pistachio",
    customer: {
      firstName: "علی",
      lastName: "محمدی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
    },
    items: [
      { name: "کیک ترافل شکلاتی", quantity: 1, price: 760000, slug: "chocolate-truffle-cake" },
      { name: "نان خامه‌ای", quantity: 2, price: 45000, slug: "cream-puff" },
    ],
    subtotal: 850000,
    shipping: 30000,
    discount: 30000,
    total: 850000,
    delivery: { method: "pickup", address: "تهران، خیابان ولیعصر، پلاک ۱۲۳" },
    payment: { method: "online", status: "paid" },
  },
  "ORD-12346": {
    id: "ORD-12346",
    date: "۱۴۰۳/۰۶/۱۸",
    status: "preparing",
    statusLabel: "در حال تهیه",
    statusColor: "text-caramel",
    customer: {
      firstName: "سارا",
      lastName: "احمدی",
      phone: "۰۹۳۵۶۶۶۷۷۸۸",
    },
    items: [
      { name: "جعبه شکلات تلخ", quantity: 1, price: 440000, slug: "dark-chocolate-box" },
    ],
    subtotal: 440000,
    shipping: 0,
    discount: 0,
    total: 440000,
    delivery: { method: "pickup", address: "شعبه ولیعصر" },
    payment: { method: "online", status: "paid" },
  },
};

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `سفارش ${id} | قندک`,
    description: `جزئیات سفارش ${id}`,
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const order = mockOrders[id];

  if (!order) {
    notFound();
  }

  const statusSteps = [
    { key: "confirmed", label: "تأیید شده", icon: "✓" },
    { key: "preparing", label: "در حال تهیه", icon: "👨‍🍳" },
    { key: "ready", label: "آماده تحویل", icon: "📦" },
    { key: "delivered", label: "تحویل داده شده", icon: "✅" },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff9f7]">
      {/* بک‌گراند دسکتاپ — همون بک‌گراند صفحه سبد خرید */}
      <div className="pointer-events-none absolute inset-0 -z-0 hidden lg:block">
        <Image
          src="/images/decor/products-bg-desktop.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/45" />
      </div>

      {/* بک‌گراند موبایل — همون بک‌گراند صفحه سبد خرید */}
      <div className="pointer-events-none absolute inset-0 -z-0 lg:hidden">
        <Image
          src="/images/decor/products-bg-mobile.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div className="relative z-10 py-12">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cocoa">سفارش #{id}</h1>
            <p className="text-sm text-cocoa/70">تاریخ ثبت: {order.date}</p>
          </div>
          <span className={`px-4 py-1 rounded-full text-sm font-medium ${order.statusColor} bg-opacity-10`}>
            {order.statusLabel}
          </span>
        </div>

        <section className="mb-8" aria-labelledby="progress-title">
          <h2 id="progress-title" className="mb-4 text-xl font-bold text-cocoa">
            پیشرفت سفارش
          </h2>
          <div className="relative">
            <div className="absolute inset-y-0 right-1/2 w-0.5 bg-cream" aria-hidden="true" />
            <ol className="relative flex items-start gap-4">
              {statusSteps.map((step, index) => (
                <li key={step.key} className="flex-1">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        index <= currentStepIndex
                          ? "border-caramel bg-caramel text-white"
                          : "border-cream bg-white text-cream"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center ${
                      index <= currentStepIndex ? "text-caramel" : "text-cream"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-cream bg-white p-6">
            <h2 className="text-xl font-bold text-caramel">محصولات سفارش</h2>
            <div className="space-y-3">
              {order.items.map((item: typeof order.items[0], index: number) => (
                <div key={index} className="flex gap-4 border-b border-cream pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="font-medium text-cocoa">{item.name}</h3>
                    </Link>
                    <p className="text-sm text-cocoa/60">تعداد: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-cocoa">
                    {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              ))}
            </div>
            <dl className="border-t border-cream pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa/70">مجموع محصولات</dt>
                <dd className="font-medium text-cocoa">{order.subtotal.toLocaleString("fa-IR")} تومان</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/70">هزینه ارسال</dt>
                <dd className="font-medium text-cocoa">{order.shipping.toLocaleString("fa-IR")} تومان</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-berry">
                  <dt className="text-cocoa/70">تخفیف</dt>
                  <dd className="font-medium">-{order.discount.toLocaleString("fa-IR")} تومان</dd>
                </div>
              )}
              <div className="border-t border-cream pt-2 flex justify-between text-lg font-bold text-cocoa">
                <dt>مبلغ پرداختی</dt>
                <dd className="text-caramel">{order.total.toLocaleString("fa-IR")} تومان</dd>
              </div>
            </dl>
          </section>

          <div className="space-y-8">
            {/* اطلاعات مشتری: اسم، نام‌خانوادگی، شماره تماس، آدرس */}
            <section className="space-y-4 rounded-xl border border-cream bg-white p-6">
              <h2 className="text-xl font-bold text-caramel">اطلاعات مشتری</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-cocoa/70">نام و نام‌خانوادگی</dt>
                <dd className="text-cocoa">
                  {order.customer.firstName} {order.customer.lastName}
                </dd>
                <dt className="text-cocoa/70">شماره تماس</dt>
                <dd className="text-cocoa" dir="ltr">
                  {order.customer.phone}
                </dd>
                <dt className="text-cocoa/70">آدرس تحویل</dt>
                <dd className="text-cocoa">{order.delivery.address}</dd>
              </dl>
            </section>

            <section className="space-y-4 rounded-xl border border-cream bg-white p-6">
              <h2 className="text-xl font-bold text-caramel">اطلاعات تحویل و پرداخت</h2>
              <dl className="space-y-3 text-sm">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  <dt className="text-cocoa/70">روش تحویل</dt>
                  <dd className="text-cocoa">پیک درون‌شهری</dd>
                  <dt className="text-cocoa/70">روش پرداخت</dt>
                  <dd className="text-cocoa">
                    {order.payment.method === "online" && "پرداخت آنلاین (زرین‌پال)"}
                    {order.payment.method === "card" && "کارت‌خوان در محل"}
                    {order.payment.method === "cash" && "پرداخت نقدی در محل"}
                  </dd>
                  <dt className="text-cocoa/70">وضعیت پرداخت</dt>
                  <dd className={`font-medium ${order.payment.status === "paid" ? "text-pistachio" : "text-berry"}`}>
                    {order.payment.status === "paid" && "پرداخت شده"}
                    {order.payment.status === "pending" && "در انتظار پرداخت"}
                    {order.payment.status === "failed" && "ناموفق"}
                  </dd>
                </div>
              </dl>
              <Link href={`/payment/result?order=${id}`}>
                <Button variant="secondary" className="w-full mt-4">
                  مشاهده رسید پرداخت
                </Button>
              </Link>
            </section>
          </div>
        </div>
      </Container>
      </div>
    </div>
  );
}