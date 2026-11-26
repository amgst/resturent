import { useQuery } from "@tanstack/react-query";
import { Home, UtensilsCrossed, ShoppingCart, Flame, Users, Calendar, DollarSign, FileText, Database, Settings, Store, QrCode, PhoneCall } from "lucide-react";
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
import { AddLocationDialog } from "@/components/add-location-dialog";
import { useAuth } from "@/lib/auth";
import { useCurrentSettings } from "@/hooks/use-settings";

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
  { title: "Call History", url: "/calls", icon: PhoneCall },
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
  const { user } = useAuth();
  const { data: settings } = useCurrentSettings();
  const currentLocation = locations.find((loc) => loc.id === selectedLocationId);
  const restaurantName = settings?.restaurantName || "Restaurant Manager";
  const userLabel = user?.displayName || user?.email?.split("@")[0] || "Staff";
  const userInitials = userLabel.slice(0, 2).toUpperCase();

  useEffect(() => {
    // Pick the first location if none is chosen, or the saved one no longer exists.
    if (locations.length > 0 && !locations.some((loc) => loc.id === selectedLocationId)) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId, setSelectedLocationId]);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate" data-testid="text-restaurant-name">{restaurantName}</span>
            <span className="text-xs text-muted-foreground truncate">{currentLocation?.name ?? "No location yet"}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Location</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex gap-2">
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
            <AddLocationDialog />
            </div>
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
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">{userLabel}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
