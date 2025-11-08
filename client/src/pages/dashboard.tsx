import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/hooks/use-location";
import { DashboardStats } from "@/components/dashboard-stats";
import { RecentOrders } from "@/components/recent-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, format } from "date-fns";

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySales: Array<{ date: string; sales: number; orders: number }>;
}

export default function Dashboard() {
  const { selectedLocationId } = useLocationStore();

  const startDate = subDays(new Date(), 7);
  const endDate = new Date();

  const { data: salesData, isLoading: isSalesLoading, error } = useQuery<SalesData>({
    queryKey: ["/api/analytics/sales", selectedLocationId, startDate.toISOString(), endDate.toISOString()],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const params = new URLSearchParams({
        locationId: selectedLocationId!,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const response = await fetch(`/api/analytics/sales?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sales data");
      return response.json();
    },
  });

  if (!selectedLocationId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a location from the sidebar</p>
      </div>
    );
  }

  const chartData = salesData?.dailySales?.map((day) => ({
    day: format(new Date(day.date), "EEE"),
    sales: Math.round(day.sales),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <DashboardStats />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {isSalesLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading sales data...</p>
              </div>
            ) : error ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-destructive">Failed to load sales data</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No sales data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {salesData && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold">${salesData.totalRevenue?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">{salesData.totalOrders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                  <p className="text-lg font-bold">${salesData.averageOrderValue?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <RecentOrders />
      </div>
    </div>
  );
}
