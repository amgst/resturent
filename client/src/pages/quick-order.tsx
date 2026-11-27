import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import {
  AlertTriangle,
  Bike,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import type { Customer, MenuCategory, MenuItem, OrderWithItems } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cleanError } from "@/components/customer-profile-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-location";
import { useCurrentSettings, useMoney } from "@/hooks/use-settings";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LookupResult {
  phone: string;
  customer: Customer | null;
  orders: OrderWithItems[];
}

interface CartLine {
  item: MenuItem;
  quantity: number;
  notes: string;
}

type OrderType = "pickup" | "delivery";

/** Most-ordered menu items across the customer's recent orders (still on the menu). */
function usualItems(orders: OrderWithItems[], menu: MenuItem[]): MenuItem[] {
  const counts = new Map<string, number>();
  for (const order of orders) {
    for (const line of order.items) {
      counts.set(line.menuItemId, (counts.get(line.menuItemId) ?? 0) + line.quantity);
    }
  }
  return Array.from(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => menu.find((m) => m.id === id && m.available))
    .filter((m): m is MenuItem => !!m)
    .slice(0, 6);
}

/**
 * Fast phone-order screen. Opened from the caller card with ?phone=…&callLogId=…,
 * or from the sidebar to take an order for any number.
 */
export default function QuickOrder() {
  const { toast } = useToast();
  const money = useMoney();
  const [, navigate] = useLocation();
  const search = useSearch();
  const { selectedLocationId } = useLocationStore();
  const { data: settings } = useCurrentSettings();
  const taxRate = settings ? parseFloat(settings.taxRate) : 0.1;

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const callLogId = params.get("callLogId");
  const [phoneInput, setPhoneInput] = useState(params.get("phone") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // A new hand-off from the caller card replaces whatever was on screen.
  useEffect(() => {
    const next = params.get("phone") ?? "";
    setPhoneInput(next);
    setPhone(next);
    setCart([]);
    setNotes("");
  }, [params]);

  const { data: menu = [], isLoading: menuLoading } = useQuery<MenuItem[]>({ queryKey: ["/api/menu-items"] });
  const { data: categories = [] } = useQuery<MenuCategory[]>({ queryKey: ["/api/menu-categories"] });

  const { data: lookup, isFetching: lookingUp } = useQuery<LookupResult>({
    queryKey: [`/api/customers/lookup?phone=${encodeURIComponent(phone)}`],
    enabled: !!phone,
    staleTime: 0,
  });
  const customer = phone ? lookup?.customer ?? null : null;
  const usual = useMemo(() => usualItems(lookup?.orders ?? [], menu), [lookup, menu]);

  useEffect(() => {
    setAddress(customer?.address ?? "");
  }, [customer?.id, customer?.address]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.filter(
      (item) =>
        item.available &&
        (categoryId === "all" || item.categoryId === categoryId) &&
        (!q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)),
    );
  }, [menu, query, categoryId]);

  const add = (item: MenuItem) =>
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { item, quantity: 1, notes: "" }];
    });

  const changeQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev.map((l) => (l.item.id === id ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0),
    );

  const setLineNotes = (id: string, value: string) =>
    setCart((prev) => prev.map((l) => (l.item.id === id ? { ...l, notes: value } : l)));

  const subtotal = cart.reduce((sum, l) => sum + parseFloat(l.item.price) * l.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedLocationId) throw new Error("Select a location in the sidebar first.");
      if (cart.length === 0) throw new Error("Add at least one item.");
      if (orderType === "delivery" && !address.trim()) throw new Error("Add a delivery address.");

      const who = customer?.name ?? (phone ? "new caller" : "walk-in");
      const summary = [
        `Phone order (${orderType}) for ${who}`,
        phone && `Ph ${phone}`,
        orderType === "delivery" && `Deliver to: ${address.trim()}`,
        notes.trim(),
      ]
        .filter(Boolean)
        .join(" · ");

      const res = await apiRequest("POST", "/api/orders", {
        locationId: selectedLocationId,
        customerId: customer?.id ?? null,
        status: "new",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes: summary,
        items: cart.map((l) => ({
          menuItemId: l.item.id,
          quantity: l.quantity,
          price: l.item.price,
          notes: l.notes.trim() || null,
        })),
      });
      return (await res.json()) as OrderWithItems;
    },
    onSuccess: async (order) => {
      if (callLogId) {
        await apiRequest("PATCH", `/api/calls/${callLogId}`, { outcome: "order_placed", orderId: order.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: `Order ${order.orderNumber} sent to the kitchen`, description: `Total ${money(order.total)}` });
      setCart([]);
      setNotes("");
      navigate("/orders");
    },
    onError: (error: Error) =>
      toast({ title: "Couldn't place order", description: cleanError(error), variant: "destructive" }),
  });

  const findCustomer = (event: FormEvent) => {
    event.preventDefault();
    setPhone(phoneInput.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quick Order</h1>
        <p className="text-muted-foreground">Take a phone or pickup order and send it straight to the kitchen.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Menu ─────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {usual.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-primary" /> {customer?.name ?? "This caller"} usually orders
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {usual.map((item) => (
                  <Button key={item.id} variant="outline" size="sm" onClick={() => add(item)} data-testid={`button-usual-${item.id}`}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> {item.name}
                    <span className="ml-2 text-muted-foreground">{money(item.price)}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search the menu…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  data-testid="input-menu-search"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ id: "all", name: "All" }, ...categories].map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={categoryId === cat.id ? "default" : "outline"}
                    onClick={() => setCategoryId(cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {menuLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : visibleItems.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  {menu.length === 0 ? "Your menu is empty. Add items in Menu Management." : "No items match."}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleItems.map((item) => {
                    const inCart = cart.find((l) => l.item.id === item.id)?.quantity ?? 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => add(item)}
                        className="hover-elevate active-elevate-2 relative flex items-center gap-3 rounded-lg border p-3 text-left"
                        data-testid={`menu-item-${item.id}`}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted">
                            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.name}</p>
                          <p className="text-sm font-semibold text-primary">{money(item.price)}</p>
                        </div>
                        {inCart > 0 && (
                          <Badge className="absolute right-2 top-2" data-testid={`badge-in-cart-${item.id}`}>
                            {inCart}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Order ────────────────────────────────────────────── */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="space-y-3">
              <CardTitle>Order</CardTitle>

              <form onSubmit={findCustomer} className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="Customer phone (optional)"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  aria-label="Customer phone"
                  data-testid="input-order-phone"
                />
                <Button type="submit" variant="outline" size="icon" aria-label="Find customer">
                  <Phone className="h-4 w-4" />
                </Button>
              </form>

              {phone && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm" data-testid="order-customer">
                  {lookingUp ? (
                    <Skeleton className="h-5 w-40" />
                  ) : customer ? (
                    <>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-muted-foreground">
                        {phone} · {customer.totalVisits} previous order{customer.totalVisits === 1 ? "" : "s"}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">{phone} — new caller (not saved as a customer)</p>
                  )}
                </div>
              )}

              {customer?.allergies && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-semibold">Allergy: </span>
                    {customer.allergies}
                  </span>
                </div>
              )}

              <ToggleGroup
                type="single"
                variant="outline"
                value={orderType}
                onValueChange={(v) => v && setOrderType(v as OrderType)}
                className="grid grid-cols-2"
              >
                <ToggleGroupItem value="pickup" data-testid="toggle-pickup">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Pickup
                </ToggleGroupItem>
                <ToggleGroupItem value="delivery" data-testid="toggle-delivery">
                  <Bike className="mr-2 h-4 w-4" /> Delivery
                </ToggleGroupItem>
              </ToggleGroup>

              {orderType === "delivery" && (
                <Input
                  placeholder="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  data-testid="input-delivery-address"
                />
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Tap menu items to add them.</p>
              ) : (
                <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                  {cart.map((line) => (
                    <div key={line.item.id} className="space-y-1.5 rounded-md bg-muted/50 p-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{line.item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {money(parseFloat(line.item.price) * line.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => changeQty(line.item.id, -1)}
                            aria-label={`One less ${line.item.name}`}
                          >
                            {line.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </Button>
                          <span className="w-6 text-center font-semibold">{line.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => changeQty(line.item.id, 1)}
                            aria-label={`One more ${line.item.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        className="h-8 text-xs"
                        placeholder="Item note, e.g. no onion"
                        value={line.notes}
                        onChange={(e) => setLineNotes(line.item.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Order notes (pickup time, instructions…)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                data-testid="input-order-notes"
              />

              <div className="space-y-1.5 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({Math.round(taxRate * 1000) / 10}%)</span>
                  <span>{money(tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-order-total">{money(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={cart.length === 0 || placeOrder.isPending}
                onClick={() => placeOrder.mutate()}
                data-testid="button-place-order"
              >
                {placeOrder.isPending
                  ? "Sending to kitchen…"
                  : cart.length === 0
                    ? "Place order"
                    : `Send to kitchen · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
