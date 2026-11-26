import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Location, RestaurantSettings } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocationStore } from "@/hooks/use-location";
import { useRestaurantSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const CURRENCIES = ["AUD", "USD", "NZD", "GBP", "EUR", "PKR"];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

interface GeneralForm {
  restaurantName: string;
  address: string;
  phone: string;
  taxPercent: string;
  currency: string;
}

interface ThemeForm {
  logoUrl: string;
  primaryColor: string;
  tagline: string;
}

export default function Settings() {
  const { selectedLocationId } = useLocationStore();
  const { toast } = useToast();

  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", selectedLocationId],
    enabled: !!selectedLocationId,
  });

  // Settings may not exist yet for a location (null) — then the first save creates them.
  const { data: settings, isLoading: settingsLoading } = useRestaurantSettings(selectedLocationId);

  const [general, setGeneral] = useState<GeneralForm>({
    restaurantName: "",
    address: "",
    phone: "",
    taxPercent: "10",
    currency: "AUD",
  });
  const [theme, setTheme] = useState<ThemeForm>({ logoUrl: "", primaryColor: "#ea580c", tagline: "" });

  // Fill the forms when the saved values arrive (or the location changes).
  useEffect(() => {
    if (settingsLoading || locationLoading) return;
    setGeneral({
      restaurantName: settings?.restaurantName ?? location?.name ?? "",
      address: location?.address ?? "",
      phone: location?.phone ?? "",
      taxPercent: settings ? String(Math.round(parseFloat(settings.taxRate) * 10000) / 100) : "10",
      currency: settings?.currency ?? "AUD",
    });
    setTheme({
      logoUrl: settings?.logoUrl ?? "",
      primaryColor: settings?.primaryColor ?? "#ea580c",
      tagline: settings?.tagline ?? "",
    });
  }, [settings, location, settingsLoading, locationLoading]);

  /** Updates existing settings, or creates them for this location the first time. */
  const saveSettings = async (values: Partial<RestaurantSettings>) => {
    if (settings) {
      await apiRequest("PATCH", `/api/settings/${settings.id}`, values);
    } else {
      await apiRequest("POST", "/api/settings", {
        locationId: selectedLocationId,
        restaurantName: general.restaurantName.trim() || location?.name || "My Restaurant",
        ...values,
      });
    }
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
  };

  const onError = (error: Error) => {
    toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
  };

  const saveGeneral = useMutation({
    mutationFn: async () => {
      const name = general.restaurantName.trim();
      const address = general.address.trim();
      const tax = parseFloat(general.taxPercent);
      if (!name) throw new Error("Restaurant name is required.");
      if (!address) throw new Error("Address is required.");
      if (Number.isNaN(tax) || tax < 0 || tax > 100) throw new Error("Tax rate must be between 0 and 100.");

      await apiRequest("PATCH", `/api/locations/${selectedLocationId}`, {
        address,
        phone: general.phone.trim() || null,
      });
      await saveSettings({
        restaurantName: name,
        taxRate: (tax / 100).toFixed(4),
        currency: general.currency,
      });
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Saved", description: "Restaurant details updated." });
    },
    onError,
  });

  const saveTheme = useMutation({
    mutationFn: async () => {
      if (!HEX_COLOR.test(theme.primaryColor)) {
        throw new Error("Colour must look like #ea580c.");
      }
      await saveSettings({
        logoUrl: theme.logoUrl.trim() || null,
        primaryColor: theme.primaryColor,
        tagline: theme.tagline.trim() || null,
      });
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Saved", description: "Branding updated." });
    },
    onError,
  });

  if (!selectedLocationId) {
    return <p className="text-muted-foreground">Select a location in the sidebar to edit its settings.</p>;
  }

  const loading = locationLoading || settingsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage settings for {location?.name ?? "this location"}
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="theme" data-testid="tab-theme">Theme & Branding</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Information</CardTitle>
              <CardDescription>Update your restaurant details</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveGeneral.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Restaurant Name</Label>
                  <Input
                    id="restaurant-name"
                    value={general.restaurantName}
                    onChange={(e) => setGeneral({ ...general, restaurantName: e.target.value })}
                    disabled={loading}
                    data-testid="input-restaurant-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={general.address}
                    onChange={(e) => setGeneral({ ...general, address: e.target.value })}
                    disabled={loading}
                    data-testid="input-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={general.phone}
                    onChange={(e) => setGeneral({ ...general, phone: e.target.value })}
                    disabled={loading}
                    data-testid="input-phone"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={general.taxPercent}
                      onChange={(e) => setGeneral({ ...general, taxPercent: e.target.value })}
                      disabled={loading}
                      data-testid="input-tax-rate"
                    />
                    <p className="text-xs text-muted-foreground">Australia GST is 10%.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={general.currency}
                      onValueChange={(currency) => setGeneral({ ...general, currency })}
                      disabled={loading}
                    >
                      <SelectTrigger id="currency" data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={loading || saveGeneral.isPending} data-testid="button-save-general">
                  {saveGeneral.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Customization</CardTitle>
              <CardDescription>Customize your restaurant's branding for customer-facing sites</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveTheme.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={theme.logoUrl}
                    onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                    disabled={loading}
                    data-testid="input-logo-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a link to your logo image. Direct uploads are coming later.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={HEX_COLOR.test(theme.primaryColor) ? theme.primaryColor : "#ea580c"}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="w-20 h-10"
                      disabled={loading}
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="flex-1"
                      disabled={loading}
                      aria-label="Primary color hex code"
                      data-testid="input-primary-color-hex"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={theme.tagline}
                    onChange={(e) => setTheme({ ...theme, tagline: e.target.value })}
                    disabled={loading}
                    data-testid="input-tagline"
                  />
                </div>
                <Button type="submit" disabled={loading || saveTheme.isPending} data-testid="button-save-theme">
                  {saveTheme.isPending ? "Saving…" : "Save Theme"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Coming soon: these switches aren't connected yet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Orders</p>
                  <p className="text-sm text-muted-foreground">Get notified when new orders arrive</p>
                </div>
                <Switch defaultChecked disabled data-testid="switch-new-orders" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reservations</p>
                  <p className="text-sm text-muted-foreground">Alerts for new and updated reservations</p>
                </div>
                <Switch defaultChecked disabled data-testid="switch-reservations" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock</p>
                  <p className="text-sm text-muted-foreground">Inventory alerts for low stock items</p>
                </div>
                <Switch disabled data-testid="switch-low-stock" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
