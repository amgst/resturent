import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down";
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={trend === "up" ? "text-green-600" : "text-red-600"}>{change}</span> from last week
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value="$12,543"
        change="+12.5%"
        icon={<DollarSign className="h-4 w-4" />}
        trend="up"
      />
      <StatCard
        title="Orders Today"
        value="89"
        change="+8.2%"
        icon={<ShoppingCart className="h-4 w-4" />}
        trend="up"
      />
      <StatCard
        title="Active Tables"
        value="24/32"
        change="-5%"
        icon={<Users className="h-4 w-4" />}
        trend="down"
      />
      <StatCard
        title="Avg Order Value"
        value="$48.20"
        change="+3.1%"
        icon={<TrendingUp className="h-4 w-4" />}
        trend="up"
      />
    </div>
  );
}
