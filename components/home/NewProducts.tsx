import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { getNewProducts } from "@/data/products";
import ProductCardStack from "@/components/product/ProductCardStack";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CurvedBottomBackground from "./CurvedBottomBackground";

const leftDecor = [
  {
    src: "/images/decor/float-whisk.webp",
    className:
      "left-10 top-[28%] w-14 sm:left-16 sm:w-16 md:left-20 max-[639px]:-translate-x-6 md:w-20 lg:left-28 lg:w-24",
    delay: "0s",
    rotate: "-8deg",
  },
  {
    src: "/images/decor/float-chocolate.webp",
    className:
      "left-16 top-1/2 w-12 sm:left-24 sm:w-14 max-[639px]:-translate-x-6 md:left-28 md:w-16 lg:left-36 lg:w-20",
    delay: "1.2s",
    rotate: "6deg",
  },
  {
    src: "/images/decor/float-cupcake-liner.webp",
    className:
      "left-10 top-[68%] w-12 sm:left-16 sm:w-14 max-[639px]:-translate-x-6 md:left-20 md:w-16 lg:left-28 lg:w-20",
    delay: "2.1s",
    rotate: "-4deg",
  },
];

const rightDecor = [
  {
    src: "/images/decor/float-flour-bowl.webp",
    className:
      "right-10 top-[28%] w-14 sm:right-16 max-[639px]:translate-x-6 sm:w-16 md:right-20 md:w-20 lg:right-28 lg:w-24",
    delay: "0.6s",
    rotate: "8deg",
  },
  {
    src: "/images/decor/float-sprinkles.webp",
    className:
      "right-16 top-1/2 w-12 sm:right-28 max-[639px]:translate-x-6 sm:w-14 md:right-28 md:w-16 lg:right-36 lg:w-20",
    delay: "1.8s",
    rotate: "-6deg",
  },
  {
    src: "/images/decor/float-cream-bag.webp",
    className:
      "right-10 top-[68%] w-12 sm:right-16 max-[639px]:translate-x-6 sm:w-14 md:right-20 md:w-16 lg:right-24 lg:w-20",
    delay: "2.6s",
    rotate: "5deg",
  },
];

export default function NewProducts() {
  const products = getNewProducts();

  if (products.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16">
      <CurvedBottomBackground />

      <Container>
        {/* تزئینات شناور - فقط از md به بالا نشون داده می‌شن تا موبایل و تبلت کوچیک شلوغ نشه */}
        <div className="pointer-events-none absolute inset-0 ">
          {leftDecor.map((item, idx) => (
            <img
              key={`l-${idx}`}
              src={item.src}
              alt=""
              aria-hidden="true"
              className={`animate-float absolute select-none opacity-95 drop-shadow-md ${item.className}`}
              style={
                {
                  animationDelay: item.delay,
                  "--float-rotate": item.rotate,
                } as React.CSSProperties
              }
            />
          ))}
          {rightDecor.map((item, idx) => (
            <img
              key={`r-${idx}`}
              src={item.src}
              alt=""
              aria-hidden="true"
              className={`animate-float absolute select-none opacity-95 drop-shadow-md ${item.className}`}
              style={
                {
                  animationDelay: item.delay,
                  "--float-rotate": item.rotate,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <SectionHeader
          title="محصولات جدید"
          subtitle="تازه‌ترین‌های قندک رو از دست نده"
          actionLabel="مشاهده همه"
          actionHref="/products"
        />

        <ScrollReveal>
          <div className="mt-16">
            <ProductCardStack products={products} />
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
