import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocationStore } from "@/hooks/use-location";
import { TableGrid } from "@/components/table-grid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Table } from "@shared/schema";

export default function Tables() {
  const { selectedLocationId } = useLocationStore();

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/tables?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch tables");
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

  if (isLoading) {
    return <div className="p-6">Loading tables...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">Manage table availability and assignments</p>
        </div>
        <Button data-testid="button-add-table">
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      <TableGrid />
    </div>
  );
}
