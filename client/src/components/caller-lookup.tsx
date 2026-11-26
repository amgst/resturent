import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Cake,
  ExternalLink,
  MapPin,
  Pencil,
  Phone,
  PhoneIncoming,
  RotateCcw,
  Search,
  Star,
  StickyNote,
  UserPlus,
} from "lucide-react";
import type { CallLog, Customer, OrderWithItems } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

function isBirthdayToday(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  const [, month, day] = birthday.split("-").map(Number);
  const today = new Date();
  return today.getMonth() + 1 === month && today.getDate() === day;
}

/** Most-ordered items across the customer's recent orders. */
function usualItems(orders: OrderWithItems[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const name = item.menuItem?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + item.quantity);
    }
  }
  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/**
 * Header button + caller card.
 * Opens by itself on an incoming call (Android app, or desktop via live alerts),
 * or staff can type a number. Incoming calls are saved to the call history.
 */
export function CallerLookup() {
  const { toast } = useToast();
  const money = useMoney();
  const { selectedLocationId } = useLocationStore();
  const {
    open,
    phone: requestedPhone,
    incoming,
    callLogId: requestedCallLogId,
    requestId,
    showCaller,
    openEmpty,
    close,
  } = useCaller();

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

  // Each open request (header button, incoming call, call history, customers page, desktop alert).
  useEffect(() => {
    if (!open || requestId === 0) return;
    setPhone(requestedPhone);
    setResult(null);
    setCallLogId(requestedCallLogId);
    if (!requestedPhone) return;
    lookup.mutate(requestedPhone, {
      onSettled: (data) => {
        // The phone saves each incoming call once. Desktop alerts already have the saved entry.
        if (incoming && !requestedCallLogId && loggedRequest.current !== requestId) {
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

  const customer = result?.customer ?? null;
  const orders = result?.orders ?? [];
  const lastOrder = orders[0];
  const usual = useMemo(() => usualItems(orders), [orders]);
  const visits = customer?.totalVisits ?? 0;
  const spent = parseFloat(customer?.totalSpent ?? "0");
  const loading = lookup.isPending;
  const unknownCaller = !loading && !!result && !customer;

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
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className={incoming ? "bg-primary text-primary-foreground" : "border-b bg-muted/50"}>
            <div className="flex items-center gap-2 px-6 pt-5 text-sm font-medium opacity-90">
              {incoming ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                  </span>
                  <PhoneIncoming className="h-4 w-4" /> Incoming call
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" /> Caller lookup
                </>
              )}
            </div>

            <div className="flex items-center gap-4 px-6 pb-5 pt-3">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${
                  incoming ? "bg-white/20" : "bg-primary text-primary-foreground"
                }`}
                aria-hidden
              >
                {loading ? "…" : customer ? initials(customer.name) : <Phone className="h-7 w-7" />}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="flex items-center gap-2 truncate text-2xl font-bold" data-testid="text-caller-name">
                  {loading ? "Looking up…" : customer ? customer.name : unknownCaller ? "New caller" : "Find a caller"}
                  {customer && isBirthdayToday(customer.birthday) && <Cake className="h-5 w-5 shrink-0" aria-label="Birthday today" />}
                </DialogTitle>
                <DialogDescription className={incoming ? "text-primary-foreground/85" : ""}>
                  {phone || (isNativeApp() ? "Calls to this phone open here automatically." : "Type a phone number below.")}
                  {customer && ` · Customer since ${format(new Date(customer.createdAt), "MMM yyyy")}`}
                </DialogDescription>
                {customer && (customer.tags ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {customer.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className={incoming ? "border-0 bg-white/20 text-primary-foreground hover:bg-white/30" : ""}
                      >
                        {tag === "VIP" && <Star className="mr-1 h-3 w-3 fill-current" />}
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <form onSubmit={search} className="flex gap-2">
              <Input
                type="tel"
                placeholder="Search a number, e.g. 0412 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Phone number"
                data-testid="input-caller-phone"
              />
              <Button type="submit" variant="outline" disabled={loading || !phone.trim()} data-testid="button-caller-search">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>

            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {!loading && customer && (
              <div className="space-y-4" data-testid="caller-found">
                {customer.allergies && (
                  <div
                    className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive"
                    role="alert"
                    data-testid="text-caller-allergies"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">Allergy / dietary</p>
                      <p className="font-medium">{customer.allergies}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Orders" value={String(visits)} />
                  <Stat label="Total spent" value={money(spent)} />
                  <Stat label="Avg order" value={visits > 0 ? money(spent / visits) : "—"} />
                  <Stat
                    label="Last order"
                    value={
                      customer.lastOrderAt
                        ? formatDistanceToNow(new Date(customer.lastOrderAt), { addSuffix: true })
                        : "—"
                    }
                  />
                </div>

                {(customer.address || customer.notes) && (
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    {customer.address && (
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          {customer.address}
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex shrink-0 items-center gap-1 text-primary hover:underline"
                        >
                          Map <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {customer.notes && (
                      <p className="flex items-start gap-2" data-testid="text-caller-notes">
                        <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        {customer.notes}
                      </p>
                    )}
                  </div>
                )}

                {usual.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usually orders</p>
                    <div className="flex flex-wrap gap-2">
                      {usual.map((item) => (
                        <Badge key={item.name} variant="outline" className="px-3 py-1 text-sm font-normal">
                          {item.name} <span className="ml-1.5 text-muted-foreground">×{item.count}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lastOrder ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last order</p>
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {lastOrder.orderNumber} · {format(new Date(lastOrder.createdAt), "EEE d MMM, h:mm a")}
                        </span>
                        <span className="font-semibold">{money(lastOrder.total)}</span>
                      </div>
                      <ul className="mt-2 space-y-0.5 text-muted-foreground">
                        {lastOrder.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity}× {item.menuItem?.name ?? "Item"}
                            {item.notes ? ` — ${item.notes}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {orders.length > 1 && (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          {orders.length - 1} earlier order{orders.length > 2 ? "s" : ""}
                        </summary>
                        <div className="mt-2 space-y-2">
                          {orders.slice(1).map((order) => (
                            <div key={order.id} className="flex justify-between gap-2 rounded-md border p-2">
                              <span className="truncate text-muted-foreground">
                                {format(new Date(order.createdAt), "d MMM")} ·{" "}
                                {order.items.map((i) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`).join(", ")}
                              </span>
                              <span className="shrink-0">{money(order.total)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No orders yet. Their first order will show here.
                  </p>
                )}
              </div>
            )}

            {unknownCaller && (
              <div className="rounded-lg border border-dashed p-6 text-center" data-testid="caller-not-found">
                <p className="font-medium">{phone} isn't in your customers yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save their name, address and allergies so you recognise them next time.
                </p>
              </div>
            )}
          </div>

          {/* ── Actions ────────────────────────────────────────── */}
          {!loading && (customer || unknownCaller) && (
            <div className="flex gap-2 border-t bg-background px-6 py-4">
              {customer ? (
                <>
                  <Button variant="outline" onClick={() => setProfileOpen(true)} data-testid="button-edit-caller">
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => repeatOrder.mutate(customer.id)}
                    disabled={!lastOrder || repeatOrder.isPending}
                    data-testid="button-repeat-order"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {repeatOrder.isPending ? "Sending to kitchen…" : lastOrder ? `Repeat last order · ${money(lastOrder.total)}` : "No previous order"}
                  </Button>
                </>
              ) : (
                <Button className="flex-1" size="lg" onClick={() => setProfileOpen(true)} data-testid="button-save-customer">
                  <UserPlus className="mr-2 h-4 w-4" /> Save as new customer
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CustomerProfileDialog
        customer={customer}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-base font-semibold" title={value}>
        {value}
      </p>
    </div>
  );
}
