import type { Metadata } from "next";
import AccountPanel from "@/components/account/AccountPanel";

export const metadata: Metadata = {
  title: "پنل کاربری",
  description: "سفارش‌ها، رسیدها و اطلاعات حساب کاربری شما در قندک",
  // A personal page must never enter an index, but the directive stays
  // crawlable so a crawler can read the instruction.
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return <AccountPanel />;
}
