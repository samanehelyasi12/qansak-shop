import JsonLd from "@/components/seo/JsonLd";
import {
  absoluteUrl,
  siteLogoHeight,
  siteLogoPath,
  siteLogoWidth,
  siteName,
  siteUrl,
  socialProfiles,
} from "@/lib/site";

/**
 * Site-wide structured data describing the Qandak confectionery storefront.
 *
 * Only verified facts present in the project are emitted: the brand name, the
 * configured site URL, the shipped logo asset, and the two social profiles
 * already linked from the Footer.
 *
 * Deliberately NOT emitted, because the project contains no verified values:
 * phone number, postal address, geo coordinates, founding date, opening hours,
 * and any LocalBusiness-specific properties. Those belong in a later pass once
 * real business data is supplied.
 */
export default function SiteJsonLd() {
  const logo = absoluteUrl(siteLogoPath);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteName,
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: logo,
            width: siteLogoWidth,
            height: siteLogoHeight,
          },
          sameAs: socialProfiles,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: siteUrl,
          inLanguage: "fa-IR",
          // Matches the real, existing /search?q= form.
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}
