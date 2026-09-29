"use client";

/**
 * A single receipt, shown in a dialog and laid out so it can be printed.
 *
 * The amounts are printed exactly as they arrived with the order. The print
 * stylesheet is mounted only while this dialog is open, and it hides the page
 * behind it by name rather than by position, so nothing else on the site is
 * affected by it.
 */

import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { DELIVERY_METHOD_LABELS, formatJalaliDateTime, formatToman } from "@/lib/account/format";
import type { AccountReceipt } from "@/lib/account/types";

interface ReceiptDialogProps {
  receipt: AccountReceipt | null;
  onClose: () => void;
}

export default function ReceiptDialog({ receipt, onClose }: ReceiptDialogProps) {
  return (
    <Modal isOpen={receipt !== null} onClose={onClose} title="رسید پرداخت">
      {receipt && (
        <div>
          <style jsx global>{`
            /* While a receipt is open, only the receipt reaches the printer.
               It is taken out of the scrollable dialog by being fixed, which
               resolves against the page rather than the dialog, so the dialog's
               own height limit and overflow cannot cut the receipt off. */
            @media print {
              body {
                background: #ffffff !important;
              }
              body * {
                visibility: hidden;
              }
              [data-receipt],
              [data-receipt] * {
                visibility: visible;
              }
              [data-receipt] {
                position: fixed;
                inset: 0;
                width: 100%;
                overflow: visible;
                max-height: none;
                border: 0;
                padding: 0;
              }
              [data-receipt-hide] {
                display: none !important;
              }
            }
          `}</style>

          <div data-receipt className="rounded-2xl border border-cream bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-cream pb-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/hero/logo.webp"
                  alt="قندک"
                  width={120}
                  height={42}
                  className="h-8 w-auto"
                />

                <div>
                  <p className="text-sm font-bold text-cocoa">شیرینی‌سرای قندک</p>
                  <p className="mt-0.5 text-[11px] text-cocoa/50">
                    تهران، خیابان ولیعصر
                  </p>
                </div>
              </div>

              <div className="text-left">
                <p className="text-sm font-bold text-cocoa">رسید پرداخت</p>
                <p className="mt-0.5 font-mono text-[11px] text-cocoa/55" dir="ltr">
                  {receipt.receiptCode}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-cocoa/55">شماره سفارش</dt>
                <dd className="font-mono font-medium text-cocoa" dir="ltr">
                  {receipt.code}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-cocoa/55">کد رهگیری سفارش</dt>
                <dd className="font-mono font-medium text-cocoa" dir="ltr">
                  {receipt.trackingCode}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-cocoa/55">تاریخ پرداخت</dt>
                <dd className="font-medium text-cocoa">
                  {formatJalaliDateTime(receipt.paidAt)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-cocoa/55">درگاه پرداخت</dt>
                <dd className="font-medium text-cocoa">{receipt.paymentGateway}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-cocoa/55">شماره پیگیری بانکی</dt>
                <dd className="font-mono font-medium text-cocoa" dir="ltr">
                  {receipt.refId}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-cocoa/55">تحویل‌گیرنده</dt>
                <dd className="font-medium text-cocoa">{receipt.recipient}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <dt className="text-cocoa/55">روش تحویل</dt>
                <dd className="font-medium text-cocoa">
                  {DELIVERY_METHOD_LABELS[receipt.deliveryMethod]}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-cocoa/55">نشانی تحویل</dt>
                <dd className="mt-1 leading-6 text-cocoa">{receipt.address}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-cream pt-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-cocoa/50">
                    <th scope="col" className="pb-2 text-right font-medium">
                      کالا
                    </th>
                    <th scope="col" className="pb-2 text-center font-medium">
                      تعداد
                    </th>
                    <th scope="col" className="pb-2 text-left font-medium">
                      مبلغ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-cream/70">
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-2">
                        <span className="block font-medium text-cocoa">{item.name}</span>
                        {item.options.length > 0 && (
                          <span className="mt-0.5 block text-[11px] text-cocoa/45">
                            {item.options
                              .map((option) => `${option.label}: ${option.value}`)
                              .join(" • ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-center text-cocoa/70">
                        {item.quantity.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-2.5 pl-2 text-left font-medium text-cocoa">
                        {formatToman(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-5 space-y-2 border-t border-cream pt-4 text-xs">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-cocoa/55">جمع محصولات</dt>
                <dd className="font-medium text-cocoa">{formatToman(receipt.subtotal)}</dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-cocoa/55">هزینه ارسال</dt>
                <dd className="font-medium text-cocoa">
                  {receipt.shipping === 0 ? "رایگان" : formatToman(receipt.shipping)}
                </dd>
              </div>

              {receipt.discount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-cocoa/55">تخفیف</dt>
                  <dd className="font-medium text-berry">
                    −{formatToman(receipt.discount)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 border-t border-cream pt-3 text-base">
                <dt className="font-bold text-cocoa">مبلغ پرداخت‌شده</dt>
                <dd className="font-bold text-caramel">{formatToman(receipt.total)}</dd>
              </div>
            </dl>

            <p className="mt-5 rounded-xl bg-pistachio/10 px-4 py-3 text-center text-xs leading-6 text-pistachio">
              این رسید به‌صورت الکترونیکی صادر شده و اعتبار آن همان اعتبار
              پرداخت شما در درگاه است.
            </p>
          </div>

          <div
            data-receipt-hide
            className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              onClick={() => window.print()}
              className="cursor-pointer rounded-xl border border-cocoa/10 px-5 py-2.5 text-sm font-medium text-cocoa/70 transition-colors duration-200 hover:bg-qandek-peach/40 hover:text-cocoa"
            >
              چاپ رسید
            </button>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-cocoa px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-caramel"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
