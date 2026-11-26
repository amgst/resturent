import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Cake, Mail, MapPin, Phone, PhoneCall, Plus, Search, Users } from "lucide-react";
import type { Customer } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { CustomerProfileDialog, SUGGESTED_TAGS } from "@/components/customer-profile-dialog";
import { useMoney } from "@/hooks/use-settings";
import { useCaller } from "@/hooks/use-caller";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

/** True when the customer's birthday (YYYY-MM-DD) falls within the next 7 days. */
function birthdaySoon(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  const [, month, day] = birthday.split("-").map(Number);
  if (!month || !day) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getMonth() + 1 === month && d.getDate() === day) return true;
  }
  return false;
}

export default function Customers() {
  const money = useMoney();
  const { showCaller } = useCaller();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = digits(q);
    return customers.filter((c) => {
      if (tagFilter && !(c.tags ?? []).includes(tagFilter)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (qDigits.length >= 3 && digits(c.phone).includes(qDigits))
      );
    });
  }, [customers, search, tagFilter]);

  const openProfile = (customer: Customer | null) => {
    setSelected(customer);
    setProfileOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading…" : `${customers.length} customer${customers.length === 1 ? "" : "s"} on file`}
          </p>
        </div>
        <Button onClick={() => openProfile(null)} data-testid="button-add-customer">
          <Plus className="mr-2 h-4 w-4" />
          Add customer
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, address or tag…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[null, ...SUGGESTED_TAGS].map((tag) => (
            <button key={tag ?? "all"} type="button" onClick={() => setTagFilter(tag)} aria-pressed={tagFilter === tag}>
              <Badge variant={tagFilter === tag ? "default" : "outline"}>{tag ?? "All"}</Badge>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Customers you save from phone calls or add here will appear in this list."
          action={
            <Button onClick={() => openProfile(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add your first customer
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different name, number or tag." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => openProfile(customer)}
              data-testid={`card-customer-${customer.id}`}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{initials(customer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{customer.name}</h3>
                      {birthdaySoon(customer.birthday) && (
                        <Cake className="h-4 w-4 shrink-0 text-primary" aria-label="Birthday this week" />
                      )}
                    </div>
                    {customer.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> <span className="truncate">{customer.email}</span>
                      </p>
                    )}
                    {customer.address && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /> <span className="truncate">{customer.address}</span>
                      </p>
                    )}
                  </div>
                  {customer.phone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Open caller view"
                      aria-label={`Open caller view for ${customer.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        showCaller(customer.phone!);
                      }}
                    >
                      <PhoneCall className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {customer.allergies && (
                  <p className="mb-3 flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> <span className="truncate">{customer.allergies}</span>
                  </p>
                )}

                {(customer.tags ?? []).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-semibold">{customer.totalVisits ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-semibold">{money(customer.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last order</p>
                    <p className="font-semibold">
                      {customer.lastOrderAt ? format(new Date(customer.lastOrderAt), "d MMM") : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerProfileDialog customer={selected} open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
