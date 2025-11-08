import { useQuery } from "@tanstack/react-query";
import { Home, UtensilsCrossed, ShoppingCart, Flame, Users, Calendar, DollarSign, FileText, Database, Settings, Store, QrCode } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLocationStore } from "@/hooks/use-location";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Location } from "@shared/schema";
import { useEffect } from "react";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Menu Management", url: "/menu", icon: UtensilsCrossed },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Kitchen Display", url: "/kitchen", icon: Flame },
  { title: "POS System", url: "/pos", icon: DollarSign },
  { title: "Tables", url: "/tables", icon: Store },
  { title: "Reservations", url: "/reservations", icon: Calendar },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Customers", url: "/customers", icon: Database },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "QR Menu", url: "/qr-menu", icon: QrCode },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { selectedLocationId, setSelectedLocationId } = useLocationStore();

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId, setSelectedLocationId]);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Restaurant Manager</span>
            <span className="text-xs text-muted-foreground">Pro Edition</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Location</SidebarGroupLabel>
          <SidebarGroupContent>
            <Select
              value={selectedLocationId || undefined}
              onValueChange={setSelectedLocationId}
              data-testid="select-location"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 hover-elevate rounded-md p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>JM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">John Manager</span>
            <span className="text-xs text-muted-foreground truncate">Admin</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
