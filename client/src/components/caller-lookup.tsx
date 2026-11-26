import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Cake,
  MapPin,
  Pencil,
  Phone,
  PhoneIncoming,
  RotateCcw,
  Search,
  UserPlus,
} from "lucide-react";
import type { CallLog, Customer, OrderWithItems } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerProfileDialog, cleanError } from "@/components/customer-profile-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-location";
import { useMoney } from "@/hooks/use-settings";
import { useCaller } from "@/hooks/use-caller";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { listenForIncomingCalls } from "@/lib/caller-id";
import { isNativeApp } from "@/lib/platform";

interface LookupResult {
  phone: string;
  customer: Customer | null;
  orders: OrderWithItems[];
}

/**
 * Header button + caller dialog.
 * Staff can type a number; in the Android app it opens by itself on an incoming call,
 * and each incoming call is saved to the call history.
 */
export function CallerLookup() {
  const { toast } = useToast();
  const money = useMoney();
  const { selectedLocationId } = useLocationStore();
  const { open, phone: requestedPhone, incoming, requestId, showCaller, openEmpty, close } = useCaller();

  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [callLogId, setCallLogId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const loggedRequest = useRef<number | null>(null);

  const logCall = useMutation({
    mutationFn: async (data: LookupResult | null) => {
      const res = await apiRequest("POST", "/api/calls", {
        phone: requestedPhone,
        locationId: selectedLocationId ?? null,
        customerId: data?.customer?.id ?? null,
        customerName: data?.customer?.name ?? null,
      });
      return (await res.json()) as CallLog;
    },
    onSuccess: (call) => {
      setCallLogId(call.id);
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
    },
  });

  const lookup = useMutation({
    mutationFn: async (number: string) => {
      const res = await apiRequest("GET", `/api/customers/lookup?phone=${encodeURIComponent(number)}`);
      return (await res.json()) as LookupResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (error: Error) => {
      setResult(null);
      toast({ title: "Lookup failed", description: cleanError(error), variant: "destructive" });
    },
  });

  // Each open request (header button, incoming call, call history, customers page).
  useEffect(() => {
    if (!open || requestId === 0) return;
    setPhone(requestedPhone);
    setResult(null);
    setCallLogId(null);
    if (!requestedPhone) return;
    lookup.mutate(requestedPhone, {
      onSettled: (data) => {
        // Save incoming calls to the history once, with the matched customer if any.
        if (incoming && loggedRequest.current !== requestId) {
          loggedRequest.current = requestId;
          logCall.mutate(data ?? null);
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // Android app: open automatically on an incoming call.
  useEffect(() => {
    let stop: () => void = () => {};
    listenForIncomingCalls(
      ({ number }) => showCaller(number, { incoming: true }),
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

  const repeatOrder = useMutation({
    mutationFn: async (customerId: string) => {
      if (!selectedLocationId) throw new Error("Select a location in the sidebar first.");
      const res = await apiRequest("POST", `/api/customers/${customerId}/repeat-last-order`, {
        locationId: selectedLocationId,
      });
      return (await res.json()) as { order: OrderWithItems; skipped: number };
    },
    onSuccess: async ({ order, skipped }) => {
      if (callLogId) {
        await apiRequest("PATCH", `/api/calls/${callLogId}`, { outcome: "order_placed", orderId: order.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: `Order ${order.orderNumber} sent to the kitchen`,
        description:
          `Total ${money(order.total)}` +
          (skipped > 0 ? ` · ${skipped} item(s) skipped because they're no longer available` : ""),
      });
      lookup.mutate(phone);
    },
    onError: (error: Error) =>
      toast({ title: "Couldn't repeat order", description: cleanError(error), variant: "destructive" }),
  });

  const search = (event: FormEvent) => {
    event.preventDefault();
    if (phone.trim()) showCaller(phone.trim());
  };

  const customer = result?.customer;
  const lastOrder = result?.orders[0];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={openEmpty}
        title="Look up caller"
        aria-label="Look up caller"
        data-testid="button-caller-lookup"
      >
        <Phone className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {incoming ? <PhoneIncoming className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5" />}
              {incoming ? "Incoming call" : "Look up caller"}
            </DialogTitle>
            <DialogDescription>
              {isNativeApp() ? "Calls to this phone open here automatically." : "Type the caller's phone number."}
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
              Search
            </Button>
          </form>

          {lookup.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {!lookup.isPending && customer && (
            <div className="space-y-4" data-testid="caller-found">
              <div className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xl font-semibold" data-testid="text-caller-name">
                      {customer.name}
                      {customer.birthday && isBirthdayToday(customer.birthday) && (
                        <Cake className="h-5 w-5 text-primary" aria-label="Birthday today" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.phone}
                      {customer.email ? ` · ${customer.email}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setProfileOpen(true)}
                    title="Edit customer"
                    aria-label="Edit customer"
                    data-testid="button-edit-caller"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                {customer.allergies && (
                  <p className="mt-3 flex items-center gap-2 rounded bg-destructive/10 p-2 text-sm font-medium text-destructive" data-testid="text-caller-allergies">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {customer.allergies}
                  </p>
                )}
                {customer.address && (
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" /> {customer.address}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {(customer.tags ?? []).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                  <Badge variant="secondary">{customer.totalVisits ?? 0} orders</Badge>
                  <Badge variant="secondary">{money(customer.totalSpent)} spent</Badge>
                  {customer.lastOrderAt && (
                    <Badge variant="secondary">Last: {format(new Date(customer.lastOrderAt), "d MMM")}</Badge>
                  )}
                </div>
                {customer.notes && (
                  <p className="mt-3 rounded bg-muted p-2 text-sm" data-testid="text-caller-notes">
                    {customer.notes}
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
                      <div className="flex justify-between gap-2">
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

          {!lookup.isPending && result && !customer && (
            <div className="space-y-3 rounded-md border p-4 text-center" data-testid="caller-not-found">
              <p className="font-medium">New caller</p>
              <p className="text-sm text-muted-foreground">{phone} isn't in your customer list yet.</p>
              <Button onClick={() => setProfileOpen(true)} data-testid="button-save-customer">
                <UserPlus className="mr-2 h-4 w-4" /> Save as new customer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CustomerProfileDialog
        customer={customer ?? null}
        initialPhone={phone}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onSaved={async (saved) => {
          // Link this call to the newly saved customer.
          if (callLogId && !customer) {
            await apiRequest("PATCH", `/api/calls/${callLogId}`, { customerId: saved.id, customerName: saved.name }).catch(() => {});
            queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
          }
          lookup.mutate(phone);
        }}
      />
    </>
  );
}

function isBirthdayToday(birthday: string): boolean {
  const [, month, day] = birthday.split("-").map(Number);
  const today = new Date();
  return today.getMonth() + 1 === month && today.getDate() === day;
}
