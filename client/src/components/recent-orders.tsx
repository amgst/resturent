import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/hooks/use-location";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const statusColors = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  preparing: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  ready: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function RecentOrders() {
  const { selectedLocationId } = useLocationStore();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/orders?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    refetchInterval: 10000,
  });

  if (!selectedLocationId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const recentOrders = orders.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50 hover-elevate"
              data-testid={`order-${order.orderNumber}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" data-testid={`text-order-id-${order.orderNumber}`}>{order.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {order.table ? `Table ${order.table.tableNumber}` : "Takeout"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.items.length} items • {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">${parseFloat(order.total).toFixed(2)}</span>
                <Badge className={statusColors[order.status]} data-testid={`badge-status-${order.orderNumber}`}>
                  {order.status}
                </Badge>
                <Button size="icon" variant="ghost" data-testid={`button-view-${order.orderNumber}`}>
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
