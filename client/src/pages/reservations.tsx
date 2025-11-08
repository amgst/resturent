import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/hooks/use-location";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Users } from "lucide-react";
import type { ReservationWithDetails } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

export default function Reservations() {
  const { selectedLocationId } = useLocationStore();

  const { data: reservations = [], isLoading } = useQuery<ReservationWithDetails[]>({
    queryKey: ["/api/reservations", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/reservations?locationId=${selectedLocationId}`);
      if (!response.ok) throw new Error("Failed to fetch reservations");
      return response.json();
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
        <Button data-testid="button-add-reservation">
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
    </div>
  );
}
