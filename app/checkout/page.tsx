import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "تکمیل خرید",
  description: "تکمیل اطلاعات ارسال و پرداخت سفارش شیرینی‌سرای قندک",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * `/checkout` used to be an abandoned prototype with its own form, its own
 * hard-coded order summary and a submit button that did nothing. The real
 * funnel is `/checkout/shipping`, which is where the cart links to, so this
 * route now just forwards there instead of competing with it.
 */
export default function CheckoutPage() {
  redirect("/checkout/shipping");
}
