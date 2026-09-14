import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import BestSellers from "@/components/home/BestSellers";
import MembershipBanner from "@/components/home/MembershipBanner";
import NewProducts from "@/components/home/NewProducts";
import Rules from "@/components/home/Rules";
import CustomerReviews from "@/components/home/CustomerReviews";
import FAQ from "@/components/home/FAQ";


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