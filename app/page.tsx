import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import BestSellers from "@/components/home/BestSellers";
import NewProducts from "@/components/home/NewProducts";
import OrderSteps from "@/components/home/OrderSteps";
import CustomerReviews from "@/components/home/CustomerReviews";
import Rules from "@/components/home/Rules";
import FAQ from "@/components/home/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <BestSellers />
      <NewProducts />
      <OrderSteps />
      <CustomerReviews />
      <Rules />
      <FAQ />
    </>
  );
}