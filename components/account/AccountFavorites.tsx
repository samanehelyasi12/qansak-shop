"use client";

/**
 * The saved list of products the customer wants to come back to.
 *
 * Reading it needs no owner field: the list is whoever is signed in. The
 * "remove" action stays on this page for now and is persisted by the backend
 * once the account is connected to it.
 */

/**
 * Favourites are links, not cart lines.
 *
 * A favourite carries a name, a picture and a price for display. It is not a
 * full product record — it has no options and no real stock — so putting one
 * straight into the cart would invent a product. Each card therefore goes to
 * the product page, where the real product and its options are known.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";

import { PanelCard } from "@/components/account/ui";
import { formatToman } from "@/lib/account/format";
import type { AccountFavorite } from "@/lib/account/types";

export default function AccountFavorites({
  favorites,
}: {
  favorites: AccountFavorite[];
}) {
  const [items, setItems] = useState(favorites);

  return (
    <PanelCard
      title="علاقه‌مندی‌ها"
      description={`${items.length.toLocaleString("fa-IR")} محصول ذخیره‌شده`}
    >
      {items.length === 0 ? (
        <div className="py-10 text-center">
          <Heart
            aria-hidden="true"
            strokeWidth={1.5}
            className="mx-auto h-8 w-8 text-cocoa/30"
          />
          <p className="mt-3 text-sm text-cocoa/60">
            هنوز محصولی ذخیره نکرده‌اید.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-xl bg-cocoa px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-caramel"
          >
            رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((favorite) => (
            <li
              key={favorite.id}
              className="flex gap-3 rounded-2xl border border-cream/80 bg-white/70 p-3"
            >
              <Link
                href={`/products/${favorite.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#fff3ee]"
              >
                <Image
                  src={favorite.image}
                  alt={favorite.name}
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/products/${favorite.slug}`}>
                  <span className="block truncate text-sm font-medium text-cocoa transition-colors hover:text-caramel">
                    {favorite.name}
                  </span>
                </Link>

                <p className="mt-1 text-sm font-bold text-cocoa">
                  {formatToman(favorite.price)}
                </p>

                {!favorite.inStock && (
                  <p className="mt-1 text-[11px] text-berry">ناموجود</p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Link
                    href={`/products/${favorite.slug}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      favorite.inStock
                        ? "bg-cocoa text-white hover:bg-caramel"
                        : "cursor-not-allowed bg-cocoa/20 text-cocoa/50"
                    }`}
                    aria-disabled={!favorite.inStock}
                    onClick={(event) => {
                      if (!favorite.inStock) event.preventDefault();
                    }}
                  >
                    مشاهده محصول
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) => current.filter((item) => item.id !== favorite.id))
                    }
                    aria-label={`حذف ${favorite.name} از علاقه‌مندی‌ها`}
                    className="mr-auto inline-flex cursor-pointer items-center rounded-lg px-2 py-1.5 text-berry/70 transition-colors hover:bg-berry/10 hover:text-berry"
                  >
                    <Trash2 aria-hidden="true" strokeWidth={1.7} className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
