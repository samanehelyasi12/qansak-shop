"use client";

/**
 * The address book: where orders have been sent, and where they can be sent next.
 *
 * The list is the customer's own — there is no owner field in the data, so an
 * address cannot be asked for by naming somebody else. Adding, editing and
 * picking a default all stay in the page for now; they are saved server-side
 * when the backend is connected.
 */

import { useState } from "react";
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { PanelCard } from "@/components/account/ui";
import type { AccountAddress } from "@/lib/account/types";

export default function AccountAddresses({
  addresses,
}: {
  addresses: AccountAddress[];
}) {
  const [items, setItems] = useState(addresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", recipient: "", phone: "", address: "" });

  const defaultAddress = items.find((item) => item.isDefault) ?? items[0];

  function openEdit(address: AccountAddress) {
    setIsAdding(false);
    setEditingId(address.id);
    setDraft({
      title: address.title,
      recipient: address.recipient,
      phone: address.phone,
      address: address.address,
    });
  }

  function openAdd() {
    setEditingId(null);
    setIsAdding(true);
    setDraft({
      title: "",
      recipient: defaultAddress?.recipient ?? "",
      phone: defaultAddress?.phone ?? "",
      address: "",
    });
  }

  function closeForm() {
    setEditingId(null);
    setIsAdding(false);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.address.trim()) return;

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...draft, address: draft.address.trim() } : item,
        ),
      );
    } else {
      setItems((current) => [
        ...current,
        {
          id: `addr-${current.length + 1}`,
          ...draft,
          address: draft.address.trim(),
          isDefault: current.length === 0,
        },
      ]);
    }

    closeForm();
  }

  function handleRemove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) closeForm();
  }

  function handleMakeDefault(id: string) {
    setItems((current) =>
      current.map((item) => ({ ...item, isDefault: item.id === id })),
    );
  }

  return (
    <>
      <PanelCard
        title="آدرس‌های من"
        description={`${items.length.toLocaleString("fa-IR")} آدرس ذخیره‌شده`}
        action={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cocoa/10 px-3 py-1.5 text-xs font-medium text-cocoa/70 transition-colors duration-200 hover:bg-qandek-peach/40 hover:text-cocoa"
          >
            <Plus aria-hidden="true" strokeWidth={2} className="h-3.5 w-3.5" />
            افزودن آدرس
          </button>
        }
      >
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-cocoa/60">
              هنوز آدرسی ثبت نکرده‌اید. برای سفارش‌های بعدی یک آدرس اضافه کنید.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((address) => (
              <li
                key={address.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  address.isDefault
                    ? "border-caramel/40 bg-qandek-cream/40"
                    : "border-cream/80 bg-white/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin
                      aria-hidden="true"
                      strokeWidth={1.7}
                      className="h-4 w-4 shrink-0 text-caramel"
                    />
                    <span className="text-sm font-bold text-cocoa">{address.title}</span>
                  </div>

                  {address.isDefault && (
                    <span className="shrink-0 rounded-full bg-cocoa px-2.5 py-0.5 text-[10px] font-medium text-white">
                      پیش‌فرض
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-6 text-cocoa/65">{address.address}</p>

                <p className="mt-1 text-xs text-cocoa/50">
                  {address.recipient}
                  <span className="mx-1.5 text-cocoa/30">•</span>
                  <span dir="ltr">{address.phone}</span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-cream/70 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cocoa/10 px-2.5 py-1.5 text-[11px] font-medium text-cocoa/65 transition-colors hover:bg-qandek-peach/40 hover:text-cocoa"
                  >
                    <Pencil aria-hidden="true" strokeWidth={1.7} className="h-3 w-3" />
                    ویرایش
                  </button>

                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleMakeDefault(address.id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cocoa/10 px-2.5 py-1.5 text-[11px] font-medium text-cocoa/65 transition-colors hover:bg-qandek-peach/40 hover:text-cocoa"
                    >
                      <Check aria-hidden="true" strokeWidth={2} className="h-3 w-3" />
                      پیش‌فرض کن
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(address.id)}
                    aria-label={`حذف آدرس ${address.title}`}
                    className="mr-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-berry/80 transition-colors hover:bg-berry/10 hover:text-berry"
                  >
                    <Trash2 aria-hidden="true" strokeWidth={1.7} className="h-3 w-3" />
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      {(isAdding || editingId) && (
        <PanelCard title={editingId ? "ویرایش آدرس" : "آدرس جدید"}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="address-title"
                label="عنوان آدرس"
                value={draft.title}
                onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
                placeholder="منزل، محل کار، ..."
              />

              <Field
                id="address-recipient"
                label="نام تحویل‌گیرنده"
                value={draft.recipient}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, recipient: value }))
                }
                placeholder="نام و نام خانوادگی"
              />
            </div>

            <Field
              id="address-phone"
              label="شماره تماس"
              value={draft.phone}
              onChange={(value) => setDraft((current) => ({ ...current, phone: value }))}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              dir="ltr"
            />

            <div>
              <label
                htmlFor="address-text"
                className="mb-2 block text-sm font-medium text-cocoa"
              >
                نشانی کامل
              </label>
              <textarea
                id="address-text"
                rows={3}
                value={draft.address}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد"
                required
                className="w-full rounded-lg border border-cream bg-white px-4 py-3 text-sm leading-7 text-cocoa placeholder:text-cocoa/35 focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-cocoa px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-caramel"
              >
                ذخیره آدرس
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="cursor-pointer rounded-xl border border-cocoa/10 px-5 py-2.5 text-sm font-medium text-cocoa/65 transition-colors hover:bg-qandek-peach/40 hover:text-cocoa"
              >
                انصراف
              </button>
            </div>
          </form>
        </PanelCard>
      )}
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-cocoa">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-cream bg-white px-4 py-2.5 text-sm text-cocoa placeholder:text-cocoa/35 focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
      />
    </div>
  );
}
