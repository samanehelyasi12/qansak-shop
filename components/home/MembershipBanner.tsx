import Image from "next/image";

export default function MembershipBanner() {
  return (
    <section
      className="relative overflow-hidden mt-[-30px]  bg-auto bg-center py-20 sm:py-28"
      style={{ backgroundImage: "url('/images/decor/discount-bg.webp')" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative mx-auto max-w-lg sm:mr-auto sm:ml-0">
          {/* ریسمان */}
          <svg
           className="absolute left-10 mt-[24px] z-40 h-20 w-16 -translate-x-8 sm:left-4 sm:translate-x-0"
            viewBox="0 0 60 80"
            fill="none"
          >
            <path
              d="M15 2 C 10 20, 45 25, 40 45 C 37 58, 30 60, 28 68"
              stroke="#2a2a2a"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* تگ آویزون */}
          <div className="absolute left-0 mt-[75px] z-20 w-20 -translate-x-10 origin-top rotate-[-6deg] animate-tag-swing sm:right-[410px] sm:w-28 sm:translate-x-0">
            <Image
              src="/images/decor/discount-tag.webp"
              alt="تخفیف ویژه ۱۵٪"
              width={1024}
              height={1536}
              sizes="(min-width: 640px) 112px, 80px"
              className="w-full drop-shadow-lg"
            />
          </div>

          {/* بنر اصلی */}
          <Image
            src="/images/decor/membership-banner.webp"
            alt="عضوی از خانواده ما شوید"
            width={1512}
            height={557}
            sizes="(min-width: 640px) 512px, 92vw"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}