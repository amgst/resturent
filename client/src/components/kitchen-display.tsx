import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";

interface KitchenOrder {
  id: string;
  orderNumber: string;
  table: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  timestamp: string;
  priority: "normal" | "urgent";
}

export function KitchenDisplay() {
  //todo: remove mock functionality
  const orders: KitchenOrder[] = [
    {
      id: "1",
      orderNumber: "#1234",
      table: "Table 5",
      items: [
        { name: "Grilled Salmon", quantity: 2 },
        { name: "Caesar Salad", quantity: 1 },
      ],
      timestamp: "2 min",
      priority: "urgent",
    },
    {
      id: "2",
      orderNumber: "#1235",
      table: "Table 12",
      items: [
        { name: "Margherita Pizza", quantity: 1 },
        { name: "Classic Burger", quantity: 2, notes: "No onions" },
      ],
      timestamp: "8 min",
      priority: "normal",
    },
    {
      id: "3",
      orderNumber: "#1236",
      table: "Table 3",
      items: [{ name: "Caesar Salad", quantity: 3 }],
      timestamp: "12 min",
      priority: "normal",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className={order.priority === "urgent" ? "border-destructive border-2" : ""}
          data-testid={`kitchen-order-${order.id}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-3xl font-bold" data-testid={`text-order-number-${order.id}`}>{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1">{order.table}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {order.priority === "urgent" && (
                  <Badge variant="destructive" data-testid={`badge-priority-${order.id}`}>Urgent</Badge>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>{order.timestamp}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 bg-muted/50 p-4 rounded-md">
              {order.items.map((item, index) => (
                <div key={index} className="text-lg">
                  <div className="font-semibold">
                    {item.quantity}x {item.name}
                  </div>
                  {item.notes && <div className="text-sm text-muted-foreground mt-1">Note: {item.notes}</div>}
                </div>
              ))}
            </div>
            <Button className="w-full" size="lg" data-testid={`button-ready-${order.id}`}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Ready
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
