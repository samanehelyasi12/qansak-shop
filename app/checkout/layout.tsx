import type { Metadata } from "next";

/**
 * Covers the whole checkout funnel: /checkout, /checkout/shipping and
 * /checkout/payment. The latter two are "use client" pages and cannot export
 * `metadata` themselves, so it is declared here at the server layout level.
 *
 * These are transactional, non-landing pages: they must not be indexed, but
 * they must remain crawlable so search engines can read this directive.
 */
export const metadata: Metadata = {
  title: "تسویه حساب",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
