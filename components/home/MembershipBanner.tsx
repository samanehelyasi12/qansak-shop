export default function MembershipBanner() {
  return (
    <section
      className="relative overflow-hidden mt-[-30px]  bg-containr bg-center py-20 sm:py-28"
      style={{ backgroundImage: "url('/images/decor/discount-bg.webp')" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative mx-auto max-w-lg sm:mr-auto sm:ml-0">
          {/* ریسمان */}
          <svg
            className="absolute mt-[30px] ml-[-60px] z-40 h-20 w-16 sm:left-16"
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
          <div className="absolute ml-[-70px] mt-[80px] z-20 w-20 origin-top rotate-[-6deg] animate-tag-swing sm:left-12 sm:w-28">
            <img
              src="/images/decor/discount-tag.webp"
              alt="تخفیف ویژه ۱۵٪"
              className="w-full drop-shadow-lg"
            />
          </div>

          {/* بنر اصلی */}
          <img
            src="/images/decor/membership-banner.webp"
            alt="عضوی از خانواده ما شوید"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}