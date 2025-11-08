import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/hooks/use-location";
import { OrderCard } from "@/components/order-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { OrderWithItems } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Orders() {
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
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a location from the sidebar</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Loading orders...</div>;
  }

  const newOrders = orders.filter((o) => o.status === "new");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  const formatOrderForCard = (order: OrderWithItems) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    table: order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Takeout",
    server: order.server?.name || "N/A",
    items: order.items.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      notes: item.notes || undefined,
    })),
    status: order.status as "new" | "preparing" | "ready" | "completed",
    timestamp: formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }),
    total: `$${parseFloat(order.total).toFixed(2)}`,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Track and manage all orders in real-time</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-md bg-blue-500/10">
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-lg px-3 py-1">
            {newOrders.length}
          </Badge>
          <span className="font-medium">New Orders</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-md bg-yellow-500/10">
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-lg px-3 py-1">
            {preparingOrders.length}
          </Badge>
          <span className="font-medium">Preparing</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-md bg-green-500/10">
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 text-lg px-3 py-1">
            {readyOrders.length}
          </Badge>
          <span className="font-medium">Ready</span>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Orders</TabsTrigger>
          <TabsTrigger value="new" data-testid="tab-new">New</TabsTrigger>
          <TabsTrigger value="preparing" data-testid="tab-preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready" data-testid="tab-ready">Ready</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard key={order.id} {...formatOrderForCard(order)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newOrders.map((order) => (
              <OrderCard key={order.id} {...formatOrderForCard(order)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preparing" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preparingOrders.map((order) => (
              <OrderCard key={order.id} {...formatOrderForCard(order)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ready" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyOrders.map((order) => (
              <OrderCard key={order.id} {...formatOrderForCard(order)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
