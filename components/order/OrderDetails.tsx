import Link from "next/link";
import OrderStatus from "./OrderStatus";

interface OrderDetailsProps {
  order: {
    id: string;
    date: string;
    status: "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      slug: string;
    }>;
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    delivery: {
      method: "express" | "standard" | "pickup";
      address: string;
    };
    payment: {
      method: "online" | "card" | "cash";
      status: "paid" | "pending" | "failed";
    };
  };
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cocoa">سفارش #{order.id}</h1>
          <p className="text-sm text-cocoa/70">تاریخ ثبت: {order.date}</p>
        </div>
        <OrderStatus status={order.status} />
      </div>

      <section className="space-y-4 rounded-xl border border-cream bg-white p-6">
        <h2 className="text-xl font-bold text-caramel">محصولات سفارش</h2>
        <div className="space-y-3">
          {order.items.map((item, index) => (
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
            <dt>مجموع قابل پرداخت</dt>
            <dd className="text-caramel">{order.total.toLocaleString("fa-IR")} تومان</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 rounded-xl border border-cream bg-white p-6 md:grid-cols-2">
        <div>
          <h3 className="mb-4 font-bold text-cocoa">اطلاعات تحویل</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-cocoa/70">روش تحویل</dt>
              <dd className="text-cocoa">
                {order.delivery.method === "express" && "پیک سریع (۳ ساعت)"}
                {order.delivery.method === "standard" && "پست پیشتاز (۱-۲ روز)"}
                {order.delivery.method === "pickup" && "تحویل حضوری از شعبه"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cocoa/70">آدرس</dt>
              <dd className="text-cocoa">{order.delivery.address}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="mb-4 font-bold text-cocoa">اطلاعات پرداخت</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-cocoa/70">روش پرداخت</dt>
              <dd className="text-cocoa">
                {order.payment.method === "online" && "پرداخت آنلاین"}
                {order.payment.method === "card" && "پرداخت کارت در محل"}
                {order.payment.method === "cash" && "پرداخت نقدی در محل"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cocoa/70">وضعیت پرداخت</dt>
              <dd className={`font-medium ${order.payment.status === "paid" ? "text-pistachio" : order.payment.status === "pending" ? "text-caramel" : "text-berry"}`}>
                {order.payment.status === "paid" && "پرداخت شده"}
                {order.payment.status === "pending" && "در انتظار پرداخت"}
                {order.payment.status === "failed" && "ناموفق"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}