import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/hooks/use-location";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { TableWithDetails } from "@shared/schema";

const statusConfig = {
  available: { label: "Available", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  occupied: { label: "Occupied", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  reserved: { label: "Reserved", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  cleaning: { label: "Cleaning", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
};

export function TableGrid() {
  const { selectedLocationId } = useLocationStore();

  const { data: tables = [], isLoading } = useQuery<TableWithDetails[]>({
    queryKey: ["/api/tables", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/tables?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  if (!selectedLocationId) {
    return <p className="text-muted-foreground">Please select a location</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading tables...</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => (
        <Card
          key={table.id}
          className="hover-elevate active-elevate-2 cursor-pointer transition-all"
          data-testid={`card-table-${table.id}`}
        >
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div>
                <div className="text-3xl font-bold" data-testid={`text-table-number-${table.id}`}>
                  {table.tableNumber}
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                  <Users className="h-3 w-3" />
                  <span>{table.capacity}</span>
                </div>
              </div>
              
              <Badge className={`${statusConfig[table.status].color} w-full justify-center`} data-testid={`badge-status-${table.id}`}>
                {statusConfig[table.status].label}
              </Badge>

              {table.status === "occupied" && table.server && (
                <div className="text-xs text-muted-foreground">
                  Server: {table.server.name}
                  <br />
                  {table.currentPartySize && `Party of ${table.currentPartySize}`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
