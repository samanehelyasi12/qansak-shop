import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import BestSellers from "@/components/home/BestSellers";
import MembershipBanner from "@/components/home/MembershipBanner";
import NewProducts from "@/components/home/NewProducts";
import Rules from "@/components/home/Rules";
import CustomerReviews from "@/components/home/CustomerReviews";
import FAQ from "@/components/home/FAQ";

export const metadata: Metadata = {
  // Only describes what the page and the site's own data actually contain:
  // the Qandak confectionery, its product categories, and online ordering.
  // No location, delivery-speed or promotional claims are asserted.
  //
  // `absolute` is required here: the homepage is the index route, not a child
  // segment, so the root layout's title.template does not apply to it.
  title: {
    absolute: "خرید کیک و شیرینی دست‌ساز | قندک",
  },
  description:
    "قندک، شیرینی‌سرای دست‌ساز با کیک، چیزکیک، تیرامیسو، کوکی، نان، سابله کیک و شکلات. انتخاب محصول و سفارش آنلاین از فروشگاه قندک.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <BestSellers />
      <MembershipBanner />
      <NewProducts />
       <Rules />
      <CustomerReviews />
      <FAQ />
    </>
  );
}