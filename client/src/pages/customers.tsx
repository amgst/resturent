import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone } from "lucide-react";

export default function Customers() {
  //todo: remove mock functionality
  const customers = [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@email.com",
      phone: "+1 234-567-8901",
      visits: 12,
      totalSpent: "$890",
      initials: "AJ",
    },
    {
      id: "2",
      name: "Bob Wilson",
      email: "bob@email.com",
      phone: "+1 234-567-8902",
      visits: 8,
      totalSpent: "$620",
      initials: "BW",
    },
    {
      id: "3",
      name: "Carol Martinez",
      email: "carol@email.com",
      phone: "+1 234-567-8903",
      visits: 15,
      totalSpent: "$1,240",
      initials: "CM",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customer Database</h1>
          <p className="text-muted-foreground">Manage customer information and preferences</p>
        </div>
        <Button data-testid="button-add-customer">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-10" data-testid="input-search" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} data-testid={`card-customer-${customer.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{customer.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Phone className="h-3 w-3" />
                    <span>{customer.phone}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Visits</p>
                  <p className="text-lg font-semibold">{customer.visits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-semibold">{customer.totalSpent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
