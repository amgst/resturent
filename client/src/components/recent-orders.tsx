import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Order {
  id: string;
  table: string;
  items: number;
  total: string;
  status: "new" | "preparing" | "ready" | "completed";
  time: string;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  preparing: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  ready: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export function RecentOrders() {
  //todo: remove mock functionality
  const orders: Order[] = [
    { id: "#1234", table: "Table 5", items: 3, total: "$42.50", status: "new", time: "2 min ago" },
    { id: "#1235", table: "Table 12", items: 5, total: "$87.20", status: "preparing", time: "8 min ago" },
    { id: "#1236", table: "Table 3", items: 2, total: "$28.00", status: "ready", time: "12 min ago" },
    { id: "#1237", table: "Table 8", items: 4, total: "$65.50", status: "completed", time: "15 min ago" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50 hover-elevate"
              data-testid={`order-${order.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" data-testid={`text-order-id-${order.id}`}>{order.id}</span>
                  <span className="text-sm text-muted-foreground">{order.table}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.items} items • {order.time}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{order.total}</span>
                <Badge className={statusColors[order.status]} data-testid={`badge-status-${order.id}`}>
                  {order.status}
                </Badge>
                <Button size="icon" variant="ghost" data-testid={`button-view-${order.id}`}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
