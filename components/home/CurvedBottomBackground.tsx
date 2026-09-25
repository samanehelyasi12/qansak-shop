export default function CurvedBottomBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d="M0,0 L1440,0 L1440,700
             C 1300,760 1200,660 1040,720
             C 900,770 820,680 700,730
             C 560,780 480,670 340,720
             C 200,760 120,680 0,730
             Z"
          className="fill-slate-50"
        />
      </svg>
    </div>
  );
}