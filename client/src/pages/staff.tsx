import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocationStore } from "@/hooks/use-location";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Staff } from "@shared/schema";

export default function StaffPage() {
  const { selectedLocationId } = useLocationStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const { data: staff = [], isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff", selectedLocationId],
    enabled: !!selectedLocationId,
    queryFn: async () => {
      const response = await fetch(`/api/staff${selectedLocationId ? `?locationId=${selectedLocationId}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch staff");
      return response.json();
    },
  });

  const createStaff = useMutation({
    mutationFn: async () => {
      if (!selectedLocationId) {
        throw new Error("Please select a location first");
      }
      if (!name.trim() || !email.trim() || !role) {
        throw new Error("Please fill in all required fields");
      }
      return apiRequest("POST", "/api/staff", {
        name: name.trim(),
        email: email.trim(),
        role,
        locationId: selectedLocationId,
        active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedLocationId] });
      setOpen(false);
      setName("");
      setEmail("");
      setRole("");
    },
    onError: (error: any) => {
      console.error("Failed to create staff:", error);
      alert(error.message || "Failed to create staff member");
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!selectedLocationId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a location from the sidebar</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Loading staff...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff members and permissions</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-add-staff">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.id} data-testid={`card-staff-${member.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                  <Badge
                    className={`mt-2 ${
                      member.active
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {member.active ? "active" : "inactive"}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid={`button-menu-${member.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Permissions</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff member. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Name *</Label>
              <Input
                id="staff-name"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="bartender">Bartender</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createStaff.mutate()}
              disabled={!name || !email || !role || createStaff.isPending}
            >
              {createStaff.isPending ? "Creating..." : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
