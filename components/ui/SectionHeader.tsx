import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel = "مشاهده همه",
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-cocoa sm:text-2xl lg:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-cocoa/60 sm:text-base">{subtitle}</p>
        )}
      </div>

      {actionHref && (
        <Link
          href={actionHref}
          className="group flex mt-4 shrink-0 items-center gap-1 rounded-full border-2 border-berry/80 px-2.5 py-1 text-[11px] font-bold text-berry transition-all hover:bg-berry hover:text-white sm:px-3 sm:py-1.5 sm:text-xs"
        >
          {actionLabel}
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 sm:h-5 sm:w-5" />
        </Link>
      )}
    </div>
  );
}
