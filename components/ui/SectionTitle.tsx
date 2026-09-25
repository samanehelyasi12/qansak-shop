interface SectionTitleProps {
  title: string;
  subtitle?: string;
  id?: string;
}

export default function SectionTitle({ title, subtitle, id }: SectionTitleProps) {
  return (
    <div className="mb-8 text-center">
      <h2 id={id} className="text-2xl font-bold text-cocoa sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-sm text-cocoa/70">{subtitle}</p>}
    </div>
  );
}
