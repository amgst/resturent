import { OrderCard } from "@/components/order-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Orders() {
  //todo: remove mock functionality
  const orders = [
    {
      id: "1234",
      orderNumber: "#1234",
      table: "Table 5",
      server: "Sarah M.",
      items: [
        { name: "Grilled Salmon", quantity: 2 },
        { name: "Caesar Salad", quantity: 1 },
        { name: "Chocolate Cake", quantity: 1, notes: "No nuts" },
      ],
      status: "new" as const,
      timestamp: "2 min ago",
      total: "$78.50",
    },
    {
      id: "1235",
      orderNumber: "#1235",
      table: "Table 12",
      server: "Mike D.",
      items: [
        { name: "Margherita Pizza", quantity: 1 },
        { name: "Classic Burger", quantity: 2 },
      ],
      status: "preparing" as const,
      timestamp: "8 min ago",
      total: "$48.97",
    },
    {
      id: "1236",
      orderNumber: "#1236",
      table: "Table 3",
      server: "Emma L.",
      items: [{ name: "Caesar Salad", quantity: 3 }],
      status: "ready" as const,
      timestamp: "12 min ago",
      total: "$38.97",
    },
  ];

  const newOrders = orders.filter((o) => o.status === "new");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

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
              <OrderCard key={order.id} {...order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newOrders.map((order) => (
              <OrderCard key={order.id} {...order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preparing" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {preparingOrders.map((order) => (
              <OrderCard key={order.id} {...order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ready" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyOrders.map((order) => (
              <OrderCard key={order.id} {...order} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
