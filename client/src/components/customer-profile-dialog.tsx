import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import type { Customer, OrderWithItems } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { useMoney } from "@/hooks/use-settings";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const SUGGESTED_TAGS = ["VIP", "Regular", "Delivery", "Pickup", "Corporate"];

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  allergies: string;
  notes: string;
  tags: string[];
}

const emptyForm = (phone = ""): FormState => ({
  name: "",
  phone,
  email: "",
  address: "",
  birthday: "",
  allergies: "",
  notes: "",
  tags: [],
});

const toForm = (c: Customer): FormState => ({
  name: c.name ?? "",
  phone: c.phone ?? "",
  email: c.email ?? "",
  address: c.address ?? "",
  birthday: c.birthday ?? "",
  allergies: c.allergies ?? "",
  notes: c.notes ?? "",
  tags: c.tags ?? [],
});

/**
 * View/edit a customer, or create one (customer = null).
 * Shows their order history when editing.
 */
export function CustomerProfileDialog({
  customer,
  open,
  onOpenChange,
  initialPhone,
  onSaved,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onSaved?: (customer: Customer) => void;
}) {
  const { toast } = useToast();
  const money = useMoney();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [tab, setTab] = useState("details");
  const isNew = !customer;

  useEffect(() => {
    if (open) {
      setForm(customer ? toForm(customer) : emptyForm(initialPhone));
      setTab("details");
    }
  }, [open, customer, initialPhone]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/customers", customer?.id, "orders"],
    queryFn: async () => (await apiRequest("GET", `/api/customers/${customer!.id}/orders?limit=50`)).json(),
    enabled: open && !!customer,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required.");
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        birthday: form.birthday || null,
        allergies: form.allergies.trim() || null,
        notes: form.notes.trim() || null,
        tags: form.tags,
      };
      const res = isNew
        ? await apiRequest("POST", "/api/customers", body)
        : await apiRequest("PATCH", `/api/customers/${customer!.id}`, body);
      return (await res.json()) as Customer;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: isNew ? "Customer added" : "Customer updated", description: saved.name });
      onSaved?.(saved);
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Couldn't save", description: cleanError(error), variant: "destructive" }),
  });

  const toggleTag = (tag: string) =>
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "New customer" : customer!.name}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Save their details so you recognise them next time they call."
              : `Customer since ${format(new Date(customer!.createdAt), "d MMM yyyy")}`}
          </DialogDescription>
        </DialogHeader>

        {!isNew && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Orders" value={String(customer!.totalVisits ?? 0)} />
            <Stat label="Total spent" value={money(customer!.totalSpent)} />
            <Stat
              label="Last order"
              value={customer!.lastOrderAt ? format(new Date(customer!.lastOrderAt), "d MMM yyyy") : "—"}
            />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          {!isNew && (
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-order-history">
                Order history{orders.length ? ` (${orders.length})` : ""}
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="details" className="mt-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cust-name">Name *</Label>
                  <Input id="cust-name" {...field("name")} data-testid="input-customer-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-phone">Phone</Label>
                  <Input id="cust-phone" type="tel" placeholder="0412 345 678" {...field("phone")} data-testid="input-customer-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-email">Email</Label>
                  <Input id="cust-email" type="email" {...field("email")} data-testid="input-customer-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-birthday">Birthday</Label>
                  <Input id="cust-birthday" type="date" {...field("birthday")} data-testid="input-customer-birthday" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-address">Delivery address</Label>
                <Input id="cust-address" placeholder="Unit, street, suburb, postcode" {...field("address")} data-testid="input-customer-address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-allergies" className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Allergies & dietary needs
                </Label>
                <Input id="cust-allergies" placeholder="e.g. Nut allergy, gluten free" {...field("allergies")} data-testid="input-customer-allergies" />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...SUGGESTED_TAGS, ...form.tags])).map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      aria-pressed={form.tags.includes(tag)}
                      data-testid={`tag-${tag}`}
                    >
                      <Badge variant={form.tags.includes(tag) ? "default" : "outline"}>{tag}</Badge>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-notes">Notes</Label>
                <Textarea id="cust-notes" rows={3} placeholder="Preferences, usual order, gate code…" {...field("notes")} data-testid="input-customer-notes" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending} data-testid="button-save-customer-profile">
                  {save.isPending ? "Saving…" : isNew ? "Add customer" : "Save changes"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {!isNew && (
            <TabsContent value="history" className="mt-4 space-y-2">
              {ordersLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders linked to this customer will appear here." />
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {order.orderNumber} · {format(new Date(order.createdAt), "d MMM yyyy, h:mm a")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{order.status}</Badge>
                        <span className="font-medium">{money(order.total)}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {order.items.map((i) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`).join(", ")}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

/** "400: {"error":"email: ..."}" → "email: ..." */
export function cleanError(error: Error): string {
  const match = error.message.match(/^\d{3}: ([\s\S]*)$/);
  if (!match) return error.message;
  try {
    const body = JSON.parse(match[1]);
    return body.error || body.message || match[1];
  } catch {
    return match[1];
  }
}
