import { OrderCard } from "../order-card";

export default function OrderCardExample() {
  return (
    <div className="max-w-md">
      <OrderCard
        id="1234"
        orderNumber="#1234"
        table="Table 5"
        server="Sarah M."
        items={[
          { name: "Grilled Salmon", quantity: 2 },
          { name: "Caesar Salad", quantity: 1 },
          { name: "Chocolate Cake", quantity: 1, notes: "No nuts" },
        ]}
        status="preparing"
        timestamp="12 min ago"
        total="$78.50"
      />
    </div>
  );
}
