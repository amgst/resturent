import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocationStore } from "@/hooks/use-location";
import { TableGrid } from "@/components/table-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Table, Area } from "@shared/schema";

export default function Tables() {
  const { selectedLocationId } = useLocationStore();
  const [open, setOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [areaId, setAreaId] = useState("");

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/tables?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["/api/areas", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/areas?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch areas");
      return response.json();
    },
  });

  const createTable = useMutation({
    mutationFn: async () => {
      if (!selectedLocationId) {
        throw new Error("Please select a location first");
      }
      if (!tableNumber.trim() || !capacity) {
        throw new Error("Please fill in all required fields");
      }
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        throw new Error("Capacity must be a valid positive number");
      }
      return apiRequest("POST", "/api/tables", {
        locationId: selectedLocationId,
        tableNumber: tableNumber.trim(),
        capacity: capacityNum,
        areaId: areaId || null,
        status: "available",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables", selectedLocationId] });
      setOpen(false);
      setTableNumber("");
      setCapacity("");
      setAreaId("");
    },
    onError: (error: any) => {
      console.error("Failed to create table:", error);
      alert(error.message || "Failed to create table");
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
        <Button onClick={() => setOpen(true)} data-testid="button-add-table">
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      <TableGrid />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Create a new table. Table number and capacity are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-number">Table Number *</Label>
              <Input
                id="table-number"
                placeholder="e.g., 1, 2, A1, etc."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="Number of seats"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area (Optional)</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No area</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTable.mutate()}
              disabled={!tableNumber || !capacity || createTable.isPending}
            >
              {createTable.isPending ? "Creating..." : "Create Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
