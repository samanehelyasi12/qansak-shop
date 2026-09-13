interface DeliveryOptionProps {
  selectedMethod: "express" | "standard" | "pickup";
  onChange: (method: "express" | "standard" | "pickup") => void;
}

const options = [
  {
    value: "express" as const,
    title: "پیک سریع (۳ ساعت)",
    description: "۳۰,۰۰۰ تومان - فقط تهران",
    freeThreshold: 500000,
  },
  {
    value: "standard" as const,
    title: "پست پیشتاز (۱-۲ روز)",
    description: "۲۰,۰۰۰ تومان - سراسر ایران",
    freeThreshold: 800000,
  },
  {
    value: "pickup" as const,
    title: "تحویل حضوری از شعبه",
    description: "رایگان - در ساعات کاری",
    freeThreshold: 0,
  },
];

export default function DeliveryOption({
  selectedMethod,
  onChange,
}: DeliveryOptionProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
            selectedMethod === option.value
              ? "border-caramel bg-caramel/5"
              : "border-cream hover:border-caramel/50"
          }`}
        >
          <input
            type="radio"
            name="delivery"
            value={option.value}
            checked={selectedMethod === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 text-caramel"
          />
          <div>
            <p className="font-medium text-cocoa">{option.title}</p>
            <p className="text-sm text-cocoa/60">{option.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}