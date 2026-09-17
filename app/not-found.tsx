import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fdeef1]">
      <section
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4"
        style={{
          backgroundImage: `url('/images/decor/404-desktop.webp')`,
        }}
      >
        {/* پس‌زمینه برای موبایل */}
        <style>{`
          @media (max-width: 1023px) {
            section {
              background-image: url('/images/decor/404-mobile.webp') !important;
            }
          }
        `}</style>

        <div className="flex w-full flex-col mt-40 items-center pt-[26vh] text-center sm:pt-[30vh] lg:pt-[32vh]">
          <p className="mb-3 text-sm font-medium text-qandek-strawberry sm:mb-4 sm:text-base lg:text-lg">
            صفحه مورد نظر یافت نشد
          </p>
          <Link
            href="/"
            className="rounded-full bg-qandek-strawberry px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-qandek-strawberry/90 active:scale-[0.98] sm:px-8 sm:py-3 sm:text-sm lg:px-10 lg:py-3.5 lg:text-base"
          >
            بازگشت به خانه
          </Link>
        </div>
      </section>
    </div>
  );
}