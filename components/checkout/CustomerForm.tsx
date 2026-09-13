"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";

interface CustomerFormProps {
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
  };
  onChange: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
  }) => void;
}

export default function CustomerForm({
  initialData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
  },
  onChange,
}: CustomerFormProps) {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  return (
    <section className="space-y-6 rounded-xl border border-cream bg-white p-6">
      <h2 className="text-xl font-bold text-caramel">اطلاعات مشتری</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          name="firstName"
          label="نام"
          placeholder="علی"
          value={formData.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          required
        />
        <Input
          name="lastName"
          label="نام خانوادگی"
          placeholder="محمدی"
          value={formData.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          required
        />
      </div>
      <Input
        name="email"
        type="email"
        label="ایمیل"
        placeholder="email@example.com"
        value={formData.email}
        onChange={(e) => handleChange("email", e.target.value)}
        required
      />
      <Input
        name="phone"
        type="tel"
        label="شماره تماس"
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        value={formData.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        required
      />
      <div className="w-full">
        <label htmlFor="address" className="block mb-2 text-sm font-medium text-cocoa">
          آدرس کامل
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          className="w-full px-4 py-2 border border-cream rounded-lg text-cocoa bg-white focus:outline-none focus:ring-2 focus:ring-caramel"
          placeholder="آدرس دقیق تحویل را وارد کنید"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          required
        ></textarea>
      </div>
      <Input
        name="postalCode"
        label="کد پستی"
        placeholder="۱۲۳۴۵۶۷۸۹۰"
        value={formData.postalCode}
        onChange={(e) => handleChange("postalCode", e.target.value)}
        required
      />
    </section>
  );
}