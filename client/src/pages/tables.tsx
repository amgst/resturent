import { TableGrid } from "@/components/table-grid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Tables() {
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
