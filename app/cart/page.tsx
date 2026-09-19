"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";

interface CartItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

const initialItems: CartItem[] = [
  {
    id: "1",
    slug: "chocolate-truffle-cake",
    name: "کیک ترافل شکلاتی",
    image: "/images/categories/cake.webp",
    price: 760000,
    quantity: 1,
  },
  {
    id: "2",
    slug: "chickpea-cookie",
    name: "نان نخودچی",
    image: "/images/categories/cookie.webp",
    price: 320000,
    quantity: 2,
  },
];

const SHIPPING_COST: number = 0;

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [discountCode, setDiscountCode] = useState("");

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff9f7]">
      {/* بک‌گراند دسکتاپ: آدرس تصویر خودتان را اینجا قرار دهید */}
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

      {/* بک‌گراند موبایل: آدرس تصویر خودتان را اینجا قرار دهید */}
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

      <div className="relative z-10 py-6 sm:py-10 lg:py-12">
        <Container>
          {/* عرض محتوا وقتی تک‌ستونه‌ست (زیر xl) محدود و وسط‌چین می‌شود تا فیلدها/کارت‌ها کش نیایند؛
              از xl به بعد که لایوت دوستونه فعال می‌شود، به عرض کامل برمی‌گردد */}
          <div className="mx-auto max-w-2xl xl:max-w-7xl">
            {/* مرحله‌های خرید */}
            <div className="mb-7 rounded-2xl border border-white/70 bg-white/80 px-3 py-4 shadow-sm backdrop-blur-md sm:px-6">
              <CheckoutStepper currentStep={1} />
            </div>

            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-caramel">قندک | خرید شما</p>
                <h1 className="text-2xl font-bold tracking-tight text-cocoa sm:text-3xl">
                  سبد خرید
                </h1>
              </div>
              <p className="text-sm text-cocoa/55">
                محصولات انتخاب‌شده را بررسی و سپس وارد مرحله اطلاعات ارسال شوید.
              </p>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              {/* محصولات */}
              <section className="min-w-0">
                <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-cream px-4 py-4 sm:px-6">
                    <div>
                      <h2 className="font-bold text-cocoa">محصولات سبد شما</h2>
                      <p className="mt-1 text-xs text-cocoa/50">{items.length} محصول</p>
                    </div>
                    
                  </div>

                  <div className="divide-y divide-cream">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-4 px-4 py-5 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                      >
                        {/* تصویر محصول: همیشه مربع ثابت ۱۱۲×۱۱۲، در هیچ breakpointـی کشیده نمی‌شود */}
                        <Link
                          href={`/products/${item.slug}`}
                          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#fff3ee]"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="112px"
                            className="object-contain p-3"
                          />
                        </Link>

                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/products/${item.slug}`}>
                                <h3 className="truncate text-base font-bold text-cocoa transition-colors hover:text-caramel">
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="mt-1 text-sm text-cocoa/55">
                                {item.price.toLocaleString("fa-IR")} تومان
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`حذف ${item.name} از سبد خرید`}
                              className="shrink-0 rounded-full p-2 text-cocoa/35 transition hover:bg-rose-50 hover:text-berry"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.75}
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:justify-start">
                            <div className="inline-flex items-center rounded-full border border-cream bg-[#fffaf8] p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                aria-label="افزایش تعداد"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-cocoa transition-colors hover:bg-cream"
                              >
                                +
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-cocoa">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                aria-label="کاهش تعداد"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-cocoa transition-colors hover:bg-cream"
                              >
                                −
                              </button>
                            </div>

                            <span className="text-sm text-cocoa/50">تعداد: {item.quantity}</span>
                          </div>
                        </div>

                        <div className="border-t border-cream pt-3 text-right sm:border-t-0 sm:pt-0 sm:text-left">
                          <p className="text-xs text-cocoa/45">مجموع</p>
                          <p className="mt-1 font-bold text-cocoa">
                            {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* جزئیات پرداخت */}
              <aside className="xl:sticky xl:top-6">
                <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.10)] backdrop-blur-md sm:p-6">
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-caramel">خلاصه سفارش</p>
                    <h2 className="mt-1 text-xl font-bold text-cocoa">جزئیات پرداخت</h2>
                  </div>

                  <dl className="space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-cocoa/60">جمع جزئی</dt>
                      <dd className="font-semibold text-cocoa">
                        {subtotal.toLocaleString("fa-IR")} تومان
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-cocoa/60">هزینه ارسال</dt>
                      <dd className="font-semibold text-cocoa">
                        {SHIPPING_COST === 0
                          ? "رایگان"
                          : `${SHIPPING_COST.toLocaleString("fa-IR")} تومان`}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    <label htmlFor="discount-code" className="mb-2 block text-xs font-medium text-cocoa/60">
                      کد تخفیف
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="discount-code"
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="مثلاً YUMMY10"
                        className="min-w-0 flex-1 rounded-xl border border-cream bg-[#fffaf8] px-3 py-2.5 text-sm text-cocoa placeholder:text-cocoa/35 focus:border-caramel focus:outline-none"
                      />
                      <button
                        type="button"
                        className="shrink-0 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-serif text-white transition-colors hover:bg-caramel"
                      >
                        اعمال
                      </button>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-cream" />

                  <div className="rounded-2xl bg-[#fff3ee] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-cocoa/65">مبلغ قابل پرداخت</span>
                      <span className="text-sm font-extra text-caramel">
                        {total.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>

                  <Link href="/checkout/shipping" className="mt-4  flex items-center justify-center ">
                    <Button  className="w-auto cursor-pointer text-sm rounded-xl">
                      ادامه و ثبت اطلاعات ←
                    </Button>
                  </Link>

                  <p className="mt-3 text-center text-xs leading-6 text-cocoa/45">
                    با ادامه، وارد مرحله ثبت اطلاعات ارسال می‌شوید.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </Container>
      </div>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-xl border border-cream bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
            <svg className="h-8 w-8 text-caramel" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-cocoa">سبد خرید شما خالی است</h1>
          <p className="mb-8 text-cocoa/70">
            هنوز محصولی به سبد اضافه نکرده‌اید. از شیرینی‌های تازه قندک شروع کنید.
          </p>
          <Link href="/categories/cake">
            <Button size="lg" className="w-full cursor-pointer">
              شروع خرید
            </Button>
          </Link>
          <Link href="/" className="mt-4 block">
            <Button variant="secondary" size="lg" className="w-full cursor-pointer">
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}