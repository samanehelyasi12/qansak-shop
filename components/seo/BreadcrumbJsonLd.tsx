import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

export interface BreadcrumbItem {
  name: string;
  /** Root-relative path, e.g. "/products". Omit for the current (last) page. */
  href?: string;
}

/**
 * Mirrors a breadcrumb that is ALREADY visible on the page.
 *
 * This component renders no markup of its own — it only describes the existing
 * visible trail to search engines, so the approved breadcrumb UI is untouched.
 * The last item is the current page and therefore has no `item` URL, exactly
 * matching how the visible breadcrumb marks it with aria-current="page".
 */
export default function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          ...(item.href ? { item: absoluteUrl(item.href) } : {}),
        })),
      }}
    />
  );
}
