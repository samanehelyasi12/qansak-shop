import type { Metadata } from "next";

/**
 * /cart is a "use client" page, so it cannot export `metadata` directly.
 * The server layout is the correct App Router place for it.
 *
 * The page stays fully accessible and crawlable — only indexing is disabled,
 * so Google must still be able to fetch the page and read this noindex.
 */
export const metadata: Metadata = {
  title: "سبد خرید",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
