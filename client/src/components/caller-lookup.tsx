import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PhoneIncoming, Phone, RotateCcw, UserPlus, Search } from "lucide-react";
import type { Customer, OrderWithItems } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-location";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { listenForIncomingCalls } from "@/lib/caller-id";
import { isNativeApp } from "@/lib/platform";

interface LookupResult {
  phone: string;
  customer: Customer | null;
  orders: OrderWithItems[];
}

const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

/**
 * Header button + dialog. Staff can type a caller's number to see who they are.
 * In the Android app, the dialog opens by itself when a call comes in.
 */
export function CallerLookup() {
  const { toast } = useToast();
  const { selectedLocationId } = useLocationStore();
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState(false);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const lookup = useMutation({
    mutationFn: async (number: string) => {
      const res = await apiRequest("GET", `/api/customers/lookup?phone=${encodeURIComponent(number)}`);
      return (await res.json()) as LookupResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (error: Error) => {
      setResult(null);
      toast({ title: "Lookup failed", description: error.message, variant: "destructive" });
    },
  });

  const addCustomer = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Enter the customer's name.");
      await apiRequest("POST", "/api/customers", {
        name: newName.trim(),
        phone: phone.trim(),
        notes: newNotes.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer saved" });
      setNewName("");
      setNewNotes("");
      lookup.mutate(phone);
    },
    onError: (error: Error) => toast({ title: "Couldn't save", description: error.message, variant: "destructive" }),
  });

  const repeatOrder = useMutation({
    mutationFn: async (customerId: string) => {
      if (!selectedLocationId) throw new Error("Select a location in the sidebar first.");
      const res = await apiRequest("POST", `/api/customers/${customerId}/repeat-last-order`, {
        locationId: selectedLocationId,
      });
      return (await res.json()) as { order: OrderWithItems; skipped: number };
    },
    onSuccess: ({ order, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: `Order ${order.orderNumber} sent to the kitchen`,
        description:
          `Total ${money(order.total)}` +
          (skipped > 0 ? ` · ${skipped} item(s) skipped because they're no longer available` : ""),
      });
      lookup.mutate(phone);
    },
    onError: (error: Error) => toast({ title: "Couldn't repeat order", description: error.message, variant: "destructive" }),
  });

  // Android app: open automatically on an incoming call.
  useEffect(() => {
    let stop: () => void = () => {};
    listenForIncomingCalls(
      ({ number }) => {
        setIncoming(true);
        setPhone(number);
        setResult(null);
        setOpen(true);
        lookup.mutate(number);
      },
      () =>
        toast({
          title: "Caller ID is off",
          description: "Allow the Phone permission in Android settings to see who's calling.",
        }),
    ).then((unsubscribe) => {
      stop = unsubscribe;
    });
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setIncoming(false);
    lookup.mutate(phone);
  };

  const customer = result?.customer;
  const lastOrder = result?.orders[0];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIncoming(false);
          setOpen(true);
        }}
        title="Look up caller"
        aria-label="Look up caller"
        data-testid="button-caller-lookup"
      >
        <Phone className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {incoming ? <PhoneIncoming className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5" />}
              {incoming ? "Incoming call" : "Look up caller"}
            </DialogTitle>
            <DialogDescription>
              {isNativeApp()
                ? "Calls to this phone open here automatically."
                : "Type the caller's phone number."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={search} className="flex gap-2">
            <Input
              type="tel"
              placeholder="0412 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone number"
              data-testid="input-caller-phone"
            />
            <Button type="submit" disabled={lookup.isPending || !phone.trim()} data-testid="button-caller-search">
              <Search className="mr-1 h-4 w-4" />
              {lookup.isPending ? "Searching…" : "Search"}
            </Button>
          </form>

          {customer && (
            <div className="space-y-4" data-testid="caller-found">
              <div className="rounded-md border p-4">
                <p className="text-xl font-semibold" data-testid="text-caller-name">{customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.phone}
                  {customer.email ? ` · ${customer.email}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{customer.totalVisits} visits</Badge>
                  <Badge variant="secondary">{money(customer.totalSpent)} spent</Badge>
                  <Badge variant="secondary">{result!.orders.length} recent orders</Badge>
                </div>
                {customer.notes && (
                  <p className="mt-3 rounded bg-muted p-2 text-sm" data-testid="text-caller-notes">
                    📝 {customer.notes}
                  </p>
                )}
              </div>

              {lastOrder ? (
                <Button
                  className="w-full"
                  onClick={() => repeatOrder.mutate(customer.id)}
                  disabled={repeatOrder.isPending}
                  data-testid="button-repeat-order"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {repeatOrder.isPending ? "Sending…" : "Repeat last order"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No previous orders yet.</p>
              )}

              {result!.orders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent orders</p>
                  {result!.orders.map((order) => (
                    <div key={order.id} className="rounded-md border p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {order.orderNumber} · {format(new Date(order.createdAt), "d MMM yyyy, h:mm a")}
                        </span>
                        <span>{money(order.total)}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {order.items.map((i) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && !customer && (
            <form
              className="space-y-3 rounded-md border p-4"
              onSubmit={(e) => {
                e.preventDefault();
                addCustomer.mutate();
              }}
              data-testid="caller-not-found"
            >
              <p className="font-medium">New caller — {phone}</p>
              <div className="space-y-1">
                <Label htmlFor="new-customer-name">Name</Label>
                <Input
                  id="new-customer-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  data-testid="input-new-customer-name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-customer-notes">Notes (address, allergies, preferences)</Label>
                <Input
                  id="new-customer-notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  data-testid="input-new-customer-notes"
                />
              </div>
              <Button type="submit" disabled={addCustomer.isPending} data-testid="button-save-customer">
                <UserPlus className="mr-2 h-4 w-4" />
                {addCustomer.isPending ? "Saving…" : "Save customer"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
