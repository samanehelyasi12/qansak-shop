import type { Product } from "@/types/product";

/**
 * قیمت‌ها در کل اپلیکیشن فقط از همین ماژول محاسبه می‌شوند.
 *
 * قانون قیمت:
 *   قیمت مؤثر محصول + مجموع priceDelta گزینه‌های انتخاب‌شده = قیمت واحد
 *   قیمت واحد × تعداد = مجموع آیتم
 */

export type SelectedOptions = Record<string, string>;

/** قیمت پایهٔ محصول؛ اگر تخفیف داشته باشد قیمت تخفیف‌خورده استفاده می‌شود. */
export function getEffectiveProductPrice(product: Product): number {
  return product.discountPrice || product.price;
}

/** مجموع افزایش قیمتِ گزینه‌های انتخاب‌شده. */
export function getSelectedOptionPriceDelta(
  product: Product,
  selectedOptions: SelectedOptions,
): number {
  const options = product.options;
  if (!options || options.length === 0) return 0;

  return options.reduce((sum, option) => {
    const selectedValueId = selectedOptions?.[option.id];
    if (!selectedValueId) return sum;

    const selectedValue = option.values.find((value) => value.id === selectedValueId);
    return sum + (selectedValue?.priceDelta ?? 0);
  }, 0);
}

/** قیمت واحد با در نظر گرفتن گزینه‌های انتخاب‌شده. */
export function getUnitPrice(
  product: Product,
  selectedOptions: SelectedOptions = {},
): number {
  return (
    getEffectiveProductPrice(product) +
    getSelectedOptionPriceDelta(product, selectedOptions)
  );
}

/** مجموع یک آیتم سبد = قیمت واحد × تعداد. */
export function getLineTotal(
  product: Product,
  selectedOptions: SelectedOptions = {},
  quantity: number = 1,
): number {
  return getUnitPrice(product, selectedOptions) * Math.max(0, quantity);
}
