import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocationStore } from "@/hooks/use-location";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Kitchen() {
  const { selectedLocationId } = useLocationStore();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/orders?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedLocationId] });
    },
  });

  if (!selectedLocationId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a location from the sidebar</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Loading orders...</div>;
  }

  const activeOrders = orders.filter((order) => ["new", "preparing"].includes(order.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kitchen Display</h1>
        <p className="text-muted-foreground">Active orders for kitchen staff</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOrders.map((order) => (
          <Card
            key={order.id}
            className={order.status === "new" ? "border-destructive border-2" : ""}
            data-testid={`kitchen-order-${order.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-3xl font-bold" data-testid={`text-order-number-${order.id}`}>{order.orderNumber}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.table ? `Table ${order.table.tableNumber}` : "Takeout"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {order.status === "new" && (
                    <Badge variant="destructive" data-testid={`badge-priority-${order.id}`}>New</Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 bg-muted/50 p-4 rounded-md">
                {order.items.map((item, index) => (
                  <div key={index} className="text-lg">
                    <div className="font-semibold">
                      {item.quantity}x {item.menuItem.name}
                    </div>
                    {item.notes && <div className="text-sm text-muted-foreground mt-1">Note: {item.notes}</div>}
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => updateStatus.mutate({ orderId: order.id, status: "ready" })}
                disabled={updateStatus.isPending}
                data-testid={`button-ready-${order.id}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Ready
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
