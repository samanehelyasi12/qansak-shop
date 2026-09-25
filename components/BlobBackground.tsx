export default function BlobBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 mt-[-20px] -z-10 h-full w-full overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d="M0,120 
             C 180,40 340,150 520,90 
             C 700,30 860,140 1040,80 
             C 1220,20 1340,110 1440,70 
             L1440,800 L0,800 Z"
          className="fill-slate-50"
        />
      </svg>
    </div>
  );
}