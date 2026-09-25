export default function HeaderDrip() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[-20px] sm:bottom-[-40px] z-20">
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="h-8 w-full sm:h-12"
      >
        <path
          d="M0,0 L0,10
             C 40,10 55,38 90,40
             C 125,42 140,14 180,16
             C 225,18 240,50 285,52
             C 330,54 345,20 390,22
             C 440,24 455,44 505,42
             C 560,40 575,12 630,14
             C 685,16 700,46 755,48
             C 810,50 825,18 875,20
             C 930,22 945,42 1000,40
             C 1055,38 1070,14 1120,16
             C 1175,18 1190,44 1245,46
             C 1300,48 1315,20 1365,22
             C 1400,23.5 1420,15 1440,10
             L1440,0 Z"
          className="fill-slate-50"
        />
      </svg>
    </div>
  );
}