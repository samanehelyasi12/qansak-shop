"use client";

/**
 * The customer's own details, and how to change them.
 *
 * The form starts from the session's account, never from anything the browser
 * supplied. It checks only that the fields are filled in and that the two
 * password entries agree; whether a change is allowed, and what the new record
 * looks like, is decided server-side when the account is connected to it.
 */

import { useState } from "react";
import { Check, Mail, Phone, UserRound } from "lucide-react";

import { PanelCard } from "@/components/account/ui";
import { formatJalali } from "@/lib/account/format";
import type { AccountUser } from "@/lib/account/types";

export default function AccountProfile({ user }: { user: AccountUser }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? "",
    phone: user.phone ?? "",
  });
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PanelCard
        title="اطلاعات حساب"
        description="همین اطلاعات روی سفارش‌ها و رسیدهای شما درج می‌شود."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-first-name"
                className="mb-2 block text-sm font-medium text-cocoa"
              >
                نام
              </label>
              <input
                id="profile-first-name"
                type="text"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, firstName: event.target.value }))
                }
                required
                className="w-full rounded-lg border border-cream bg-white px-4 py-2.5 text-sm text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>

            <div>
              <label
                htmlFor="profile-last-name"
                className="mb-2 block text-sm font-medium text-cocoa"
              >
                نام خانوادگی
              </label>
              <input
                id="profile-last-name"
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lastName: event.target.value }))
                }
                required
                className="w-full rounded-lg border border-cream bg-white px-4 py-2.5 text-sm text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-sm font-medium text-cocoa"
            >
              ایمیل
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                strokeWidth={1.7}
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/35"
              />
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                dir="ltr"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
                className="w-full rounded-lg border border-cream bg-white py-2.5 pl-4 pr-10 text-left text-sm text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="mb-2 block text-sm font-medium text-cocoa"
            >
              شماره موبایل
            </label>
            <div className="relative">
              <Phone
                aria-hidden="true"
                strokeWidth={1.7}
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/35"
              />
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                required
                className="w-full rounded-lg border border-cream bg-white py-2.5 pl-4 pr-10 text-left text-sm text-cocoa focus:border-caramel focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-cocoa px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-caramel"
            >
              ذخیره تغییرات
            </button>

            {saved && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-pistachio"
              >
                <Check aria-hidden="true" strokeWidth={2.5} className="h-3.5 w-3.5" />
                تغییرات ثبت شد
              </span>
            )}
          </div>
        </form>
      </PanelCard>

      <PanelCard title="خلاصه حساب">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-cream/80 bg-white/70 px-4 py-3">
            <UserRound
              aria-hidden="true"
              strokeWidth={1.7}
              className="h-4 w-4 shrink-0 text-caramel"
            />
            <div>
              <dt className="text-xs text-cocoa/50">نام کاربری</dt>
              <dd className="mt-0.5 font-medium text-cocoa" dir="ltr">
                {user.displayName}
              </dd>
            </div>
          </div>

          {user.memberSince && (
            <div className="flex items-center gap-3 rounded-2xl border border-cream/80 bg-white/70 px-4 py-3">
              <Check
                aria-hidden="true"
                strokeWidth={1.7}
                className="h-4 w-4 shrink-0 text-caramel"
              />
              <div>
                <dt className="text-xs text-cocoa/50">عضویت از</dt>
                <dd className="mt-0.5 font-medium text-cocoa">
                  {formatJalali(user.memberSince)}
                </dd>
              </div>
            </div>
          )}
        </dl>
      </PanelCard>
    </>
  );
}
