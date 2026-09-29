/**
 * Placeholder data for the account panel.
 *
 * Nothing here talks to the server. The panel is fully clickable with this
 * data so the layout, wording and states can be reviewed on their own; when
 * the backend is wired up, only `mock.ts` goes away and the components keep
 * the exact same props.
 */

import type {
  AccountAddress,
  AccountFavorite,
  AccountOrder,
  AccountReceipt,
  AccountUser,
} from "./types";

export const MOCK_ACCOUNT_USER: AccountUser = {
  id: 1,
  firstName: "زهرا",
  lastName: "کریمی",
  displayName: "زهرا کریمی",
  email: "zahra.karimi@example.com",
  phone: "۰۹۱۲۳۴۵۶۷۸۹",
  memberSince: "2024-11-02",
  referralCode: "ZAHRA20",
  loyaltyPoints: 1240,
};

/**
 * The records below are placeholders, not the customer's real ones. Nothing
 * here is fetched; the panel says so on screen rather than passing them off as
 * real orders. This flag is what puts that line on the page — flipping it to
 * `false` is part of connecting the panel to the backend.
 */
export const ACCOUNT_RECORDS_ARE_PLACEHOLDER = true;

export const MOCK_ORDERS: AccountOrder[] = [
  {
    code: "QND-10428",
    trackingCode: "TRK-88213764",
    createdAt: "2026-09-27T14:20:00",
    status: "preparing",
    paymentStatus: "paid",
    deliveryMethod: "express",
    recipient: "زهرا کریمی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    address: "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۲۳، واحد ۵",
    items: [
      {
        id: 1,
        name: "کیک ترافل شکلاتی",
        slug: "chocolate-truffle-cake",
        image: "/images/categories/cake.webp",
        quantity: 1,
        unitPrice: 890000,
        total: 890000,
        options: [
          { label: "سایز", value: "۱۸ سانتی" },
          { label: "نوشته روی کیک", value: "تولید روز" },
        ],
      },
      {
        id: 2,
        name: "شکلات تلخ دست‌ساز",
        slug: "dark-chocolate",
        image: "/images/categories/sable.webp",
        quantity: 2,
        unitPrice: 145000,
        total: 290000,
        options: [{ label: "وزن", value: "۱۰۰ گرم" }],
      },
    ],
    subtotal: 1180000,
    shipping: 45000,
    discount: 118000,
    total: 1107000,
  },
  {
    code: "QND-10397",
    trackingCode: "TRK-88190512",
    createdAt: "2026-09-14T09:05:00",
    status: "delivered",
    paymentStatus: "paid",
    deliveryMethod: "standard",
    recipient: "زهرا کریمی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    address: "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۲۳، واحد ۵",
    items: [
      {
        id: 3,
        name: "چیزکیک لیمو",
        slug: "lemon-cheesecake",
        image: "/images/categories/cheesecake.webp",
        quantity: 1,
        unitPrice: 520000,
        total: 520000,
        options: [],
      },
      {
        id: 4,
        name: "کوکی کره‌ای",
        slug: "butter-cookie",
        image: "/images/categories/cookie.webp",
        quantity: 1,
        unitPrice: 235000,
        total: 235000,
        options: [],
      },
    ],
    subtotal: 755000,
    shipping: 35000,
    discount: 0,
    total: 790000,
  },
  {
    code: "QND-10355",
    trackingCode: "TRK-88172240",
    createdAt: "2026-08-30T18:40:00",
    status: "delivered",
    paymentStatus: "paid",
    deliveryMethod: "pickup",
    recipient: "زهرا کریمی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    address: "شعبه ولیعصر، تهران",
    items: [
      {
        id: 5,
        name: "باکس شکلات کادویی",
        slug: "chocolate-gift-box",
        image: "/images/categories/candy.webp",
        quantity: 1,
        unitPrice: 610000,
        total: 610000,
        options: [{ label: "بسته‌بندی", value: "مجلل" }],
      },
    ],
    subtotal: 610000,
    shipping: 0,
    discount: 61000,
    total: 549000,
  },
  {
    code: "QND-10288",
    trackingCode: "TRK-88150118",
    createdAt: "2026-08-11T11:15:00",
    status: "delivered",
    paymentStatus: "refunded",
    deliveryMethod: "standard",
    recipient: "زهرا کریمی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    address: "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۲۳، واحد ۵",
    items: [
      {
        id: 6,
        name: "تیرامیسو کلاسیک",
        slug: "classic-tiramisu",
        image: "/images/categories/tiramisu.webp",
        quantity: 2,
        unitPrice: 268000,
        total: 536000,
        options: [],
      },
    ],
    subtotal: 536000,
    shipping: 35000,
    discount: 0,
    total: 571000,
  },
  {
    code: "QND-10241",
    trackingCode: "TRK-88130077",
    createdAt: "2026-07-29T20:00:00",
    status: "cancelled",
    paymentStatus: "pending",
    deliveryMethod: "pickup",
    recipient: "زهرا کریمی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    address: "شعبه ولیعصر، تهران",
    items: [
      {
        id: 7,
        name: "کیک هوش و پنیر",
        slug: "smart-cheese-cake",
        image: "/images/categories/cheesecake.webp",
        quantity: 1,
        unitPrice: 480000,
        total: 480000,
        options: [],
      },
    ],
    subtotal: 480000,
    shipping: 0,
    discount: 0,
    total: 480000,
  },
];

/**
 * Receipts are the orders money actually moved for. The three paid orders
 * above are the same three, with their paper details added.
 */
export const MOCK_RECEIPTS: AccountReceipt[] = [
  {
    ...MOCK_ORDERS[0],
    receiptCode: "RCP-2026-0417",
    paidAt: "2026-09-27T14:21:30",
    refId: "ZP-7741902884",
    paymentGateway: "زرین‌پال",
  },
  {
    ...MOCK_ORDERS[1],
    receiptCode: "RCP-2026-0381",
    paidAt: "2026-09-14T09:06:10",
    refId: "ZP-7738054612",
    paymentGateway: "زرین‌پال",
  },
  {
    ...MOCK_ORDERS[2],
    receiptCode: "RCP-2026-0296",
    paidAt: "2026-08-30T18:41:02",
    refId: "ZP-7719023380",
    paymentGateway: "درگاه پرداخت بانک ملت",
  },
  {
    ...MOCK_ORDERS[3],
    receiptCode: "RCP-2026-0213",
    paidAt: "2026-08-11T11:16:40",
    refId: "ZP-7704519927",
    paymentGateway: "زرین‌پال",
  },
];

export const MOCK_ADDRESSES: AccountAddress[] = [
  {
    id: "addr-home",
    title: "منزل",
    recipient: "زهرا کریمی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    address: "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۲۳، واحد ۵",
    isDefault: true,
  },
  {
    id: "addr-work",
    title: "محل کار",
    recipient: "زهرا کریمی",
    phone: "۰۲۱۸۸۴۵۵۶۶۷",
    address: "تهران، میدان ونک، خیابان ملاصدرا، برج نگین، طبقه ۹، واحد ۹۰۳",
    isDefault: false,
  },
];

export const MOCK_FAVORITES: AccountFavorite[] = [
  {
    id: "fav-1",
    name: "کیک شکلاتی فرانسوی",
    slug: "french-chocolate-cake",
    image: "/images/categories/cake.webp",
    price: 950000,
    inStock: true,
  },
  {
    id: "fav-2",
    name: "کیک کارامل و بادام",
    slug: "caramel-almond-cake",
    image: "/images/categories/tiramisu.webp",
    price: 780000,
    inStock: true,
  },
  {
    id: "fav-3",
    name: "شکلات سفید دست‌ساز",
    slug: "white-chocolate",
    image: "/images/categories/sable.webp",
    price: 132000,
    inStock: false,
  },
];
