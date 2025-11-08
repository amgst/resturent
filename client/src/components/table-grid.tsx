import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  currentParty?: number;
  server?: string;
}

const statusConfig = {
  available: { label: "Available", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  occupied: { label: "Occupied", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  reserved: { label: "Reserved", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  cleaning: { label: "Cleaning", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
};

export function TableGrid() {
  //todo: remove mock functionality
  const tables: Table[] = [
    { id: "1", number: "1", capacity: 2, status: "occupied", currentParty: 2, server: "Sarah" },
    { id: "2", number: "2", capacity: 2, status: "available" },
    { id: "3", number: "3", capacity: 4, status: "occupied", currentParty: 4, server: "Mike" },
    { id: "4", number: "4", capacity: 4, status: "reserved" },
    { id: "5", number: "5", capacity: 6, status: "occupied", currentParty: 5, server: "Emma" },
    { id: "6", number: "6", capacity: 2, status: "cleaning" },
    { id: "7", number: "7", capacity: 4, status: "available" },
    { id: "8", number: "8", capacity: 8, status: "reserved" },
  ];

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
                  {table.number}
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
                  Server: {table.server}
                  <br />
                  Party of {table.currentParty}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
