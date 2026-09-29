"use client";

/**
 * The receipts a customer can prove a payment with.
 *
 * A receipt is listed as a fact — code, date, amount, gateway reference — and
 * opens as a document that can be printed. The amounts are never recomputed
 * here: they are the ones the order came with.
 */

import { useMemo, useState } from "react";
import { Eye, Printer } from "lucide-react";

import { PanelCard, PaymentStatusChip } from "@/components/account/ui";
import ReceiptDialog from "@/components/account/ReceiptDialog";
import { formatJalali, formatToman } from "@/lib/account/format";
import type { AccountReceipt } from "@/lib/account/types";

export default function AccountReceipts({
  receipts,
}: {
  receipts: AccountReceipt[];
}) {
  const [openReceipt, setOpenReceipt] = useState<AccountReceipt | null>(null);

  const sorted = useMemo(
    () => [...receipts].sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    [receipts],
  );

  const totalPaid = receipts
    .filter((receipt) => receipt.paymentStatus === "paid")
    .reduce((sum, receipt) => sum + receipt.total, 0);

  return (
    <>
      <PanelCard
        title="رسیدهای من"
        description={`${receipts.length.toLocaleString("fa-IR")} رسید در حساب شما`}
        action={
          <div className="rounded-2xl border border-qandek-pink/50 bg-qandek-cream/60 px-4 py-2.5 text-center">
            <p className="text-[11px] text-cocoa/55">مجموع پرداخت‌شده</p>
            <p className="mt-0.5 text-sm font-bold text-caramel">
              {formatToman(totalPaid)}
            </p>
          </div>
        }
      >
        {sorted.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-cocoa/60">هنوز رسیدی برای شما صادر نشده است.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((receipt) => (
              <li
                key={receipt.receiptCode}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cream/80 bg-white/70 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-mono text-sm font-bold text-cocoa"
                      dir="ltr"
                    >
                      {receipt.receiptCode}
                    </span>
                    <PaymentStatusChip status={receipt.paymentStatus} />
                  </p>

                  <p className="mt-2 text-xs text-cocoa/55">
                    سفارش{" "}
                    <span className="font-mono" dir="ltr">
                      {receipt.code}
                    </span>
                    <span className="mx-1.5 text-cocoa/30">•</span>
                    {formatJalali(receipt.paidAt)}
                  </p>

                  <p className="mt-1 text-[11px] text-cocoa/45">
                    {receipt.paymentGateway}
                    <span className="mx-1.5 text-cocoa/30">•</span>
                    <span className="font-mono" dir="ltr">
                      {receipt.refId}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-cocoa">
                    {formatToman(receipt.total)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setOpenReceipt(receipt)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-cocoa/10 px-3 py-2 text-xs font-medium text-cocoa/70 transition-colors duration-200 hover:bg-qandek-peach/40 hover:text-cocoa"
                  >
                    <Eye aria-hidden="true" strokeWidth={1.7} className="h-3.5 w-3.5" />
                    مشاهده
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-cocoa/45">
          <Printer aria-hidden="true" strokeWidth={1.7} className="h-3.5 w-3.5" />
          برای چاپ رسید، آن را باز کنید و دکمهٔ «چاپ رسید» را بزنید.
        </p>
      </PanelCard>

      <ReceiptDialog receipt={openReceipt} onClose={() => setOpenReceipt(null)} />
    </>
  );
}
