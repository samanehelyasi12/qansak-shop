import type { Product } from "@/types/product";
import type { SelectedOptions } from "@/lib/pricing";

export interface CartItem {
  /** شناسهٔ یکتای این آیتم: ترکیب محصول و گزینه‌های انتخاب‌شده */
  id: string;
  /** هویت محصول (برای لینک، تصویر، نام و ادغام با داده‌های بک‌اند) */
  product: Product;
  /** گزینه‌های انتخاب‌شدهٔ کاربر */
  selectedOptions: SelectedOptions;
  /** تعداد */
  quantity: number;
  /** قیمت واحد مؤثر در لحظهٔ افزودن به سبد (شامل priceDelta گزینه‌ها) */
  unitPrice: number;
}

export interface CartState {
  items: CartItem[];
}
