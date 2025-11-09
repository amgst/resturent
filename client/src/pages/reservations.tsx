import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocationStore } from "@/hooks/use-location";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Plus, Clock, Users } from "lucide-react";
import type { ReservationWithDetails, Table } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

export default function Reservations() {
  const { selectedLocationId } = useLocationStore();
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [partySize, setPartySize] = useState("");
  const [tableId, setTableId] = useState("");

  const { data: reservations = [], isLoading } = useQuery<ReservationWithDetails[]>({
    queryKey: ["/api/reservations", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/reservations?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch reservations");
      return response.json();
    },
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["/api/tables", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/tables?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  const createReservation = useMutation({
    mutationFn: async () => {
      if (!selectedLocationId) {
        throw new Error("Please select a location first");
      }
      if (!customerName.trim() || !reservationDate || !partySize) {
        throw new Error("Please fill in all required fields");
      }
      const partySizeNum = parseInt(partySize);
      if (isNaN(partySizeNum) || partySizeNum <= 0) {
        throw new Error("Party size must be a valid positive number");
      }
      return apiRequest("POST", "/api/reservations", {
        locationId: selectedLocationId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerEmail: customerEmail.trim() || null,
        reservationDate: new Date(reservationDate).toISOString(),
        partySize: partySizeNum,
        tableId: tableId || null,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", selectedLocationId] });
      setOpen(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setReservationDate("");
      setPartySize("");
      setTableId("");
    },
    onError: (error: any) => {
      console.error("Failed to create reservation:", error);
      alert(error.message || "Failed to create reservation");
    },
  });

  const statusColors = {
    confirmed: "bg-green-500/10 text-green-700 dark:text-green-400",
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  if (!selectedLocationId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a location from the sidebar</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Loading reservations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="text-muted-foreground">Manage table bookings and reservations</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-add-reservation">
          <Plus className="h-4 w-4 mr-2" />
          New Reservation
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reservations.map((reservation) => (
          <Card key={reservation.id} data-testid={`card-reservation-${reservation.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>{reservation.customerName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reservation.table ? `Table ${reservation.table.tableNumber}` : "No table assigned"}
                  </p>
                </div>
                <Badge className={statusColors[reservation.status as keyof typeof statusColors]}>
                  {reservation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(reservation.reservationDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(reservation.reservationDate), "h:mm a")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.partySize} guests</span>
              </div>
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" className="flex-1" data-testid={`button-edit-${reservation.id}`}>
                  Edit
                </Button>
                <Button className="flex-1" data-testid={`button-confirm-${reservation.id}`}>
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>
              Create a new reservation. Customer name, date/time, and party size are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                placeholder="Full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="+1-555-0100"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-date">Date & Time *</Label>
              <Input
                id="reservation-date"
                type="datetime-local"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="party-size">Party Size *</Label>
              <Input
                id="party-size"
                type="number"
                min="1"
                placeholder="Number of guests"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Table (Optional)</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No table assigned</SelectItem>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.tableNumber} (Capacity: {table.capacity})
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
              onClick={() => createReservation.mutate()}
              disabled={!customerName || !reservationDate || !partySize || createReservation.isPending}
            >
              {createReservation.isPending ? "Creating..." : "Create Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
