interface OrderStatusProps {
  status: "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
}

const statusConfig = {
  confirmed: { label: "تأیید شده", color: "text-caramel", bgColor: "bg-caramel/10" },
  preparing: { label: "در حال تهیه", color: "text-caramel", bgColor: "bg-caramel/10" },
  ready: { label: "آماده تحویل", color: "text-pistachio", bgColor: "bg-pistachio/10" },
  delivered: { label: "تحویل داده شده", color: "text-pistachio", bgColor: "bg-pistachio/10" },
  cancelled: { label: "لغو شده", color: "text-berry", bgColor: "bg-berry/10" },
};

export default function OrderStatus({ status }: OrderStatusProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${config.color} ${config.bgColor}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </span>
  );
}