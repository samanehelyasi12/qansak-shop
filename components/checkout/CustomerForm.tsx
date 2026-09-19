"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";

interface CustomerFormProps {
  initialData?: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  };
  onChange: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  }) => void;
}

export default function CustomerForm({
  initialData = {
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
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
    <section className="space-y-6 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_50px_rgba(80,40,30,0.08)] backdrop-blur-md sm:p-6">
      <h2 className="text-xl font-bold text-caramel">اطلاعات مشتری</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          name="firstName"
          label="نام"
          placeholder=""
          value={formData.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          required
        />
        <Input
          name="lastName"
          label="نام خانوادگی"
          placeholder=""
          value={formData.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          required
        />
      </div>
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
          آدرس کامل <span className="text-berry">*</span>
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          className="w-full px-4 py-2 border border-cream rounded-lg text-cocoa bg-[#fffaf8] focus:outline-none focus:ring-2 focus:ring-caramel"
          placeholder="آدرس دقیق تحویل (داخل شهر) را وارد کنید"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          required
        ></textarea>
      </div>
    </section>
  );
}