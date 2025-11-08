import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Printer, CheckCircle2 } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface OrderCardProps {
  id: string;
  orderNumber: string;
  table: string;
  server: string;
  items: OrderItem[];
  status: "new" | "preparing" | "ready" | "completed";
  timestamp: string;
  total: string;
}

const statusConfig = {
  new: { label: "New Order", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  preparing: { label: "Preparing", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  ready: { label: "Ready", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  completed: { label: "Completed", color: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
};

export function OrderCard({ id, orderNumber, table, server, items, status, timestamp, total }: OrderCardProps) {
  return (
    <Card data-testid={`card-order-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-bold" data-testid={`text-order-number-${id}`}>{orderNumber}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{table}</span>
              <span>•</span>
              <span>{server}</span>
            </div>
          </div>
          <Badge className={statusConfig[status].color} data-testid={`badge-status-${id}`}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between gap-2">
              <span className="text-sm">
                {item.quantity}x {item.name}
                {item.notes && <span className="text-muted-foreground block text-xs">({item.notes})</span>}
              </span>
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timestamp}</span>
          </div>
          <span className="font-bold text-lg">{total}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" data-testid={`button-print-${id}`}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="flex-1" data-testid={`button-complete-${id}`}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
