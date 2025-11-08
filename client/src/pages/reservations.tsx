import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Users } from "lucide-react";

export default function Reservations() {
  //todo: remove mock functionality
  const reservations = [
    {
      id: "1",
      name: "John Smith",
      guests: 4,
      date: "Today",
      time: "7:00 PM",
      status: "confirmed",
      table: "Table 8",
    },
    {
      id: "2",
      name: "Emma Johnson",
      guests: 2,
      date: "Today",
      time: "7:30 PM",
      status: "pending",
      table: "Table 4",
    },
    {
      id: "3",
      name: "Michael Brown",
      guests: 6,
      date: "Tomorrow",
      time: "6:00 PM",
      status: "confirmed",
      table: "Table 10",
    },
  ];

  const statusColors = {
    confirmed: "bg-green-500/10 text-green-700 dark:text-green-400",
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

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
                  <CardTitle>{reservation.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{reservation.table}</p>
                </div>
                <Badge className={statusColors[reservation.status as keyof typeof statusColors]}>
                  {reservation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.guests} guests</span>
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
