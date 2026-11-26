import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { CheckCircle2, PhoneCall, PhoneIncoming, PhoneMissed, Search } from "lucide-react";
import type { CallLog } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { useLocationStore } from "@/hooks/use-location";
import { useCaller } from "@/hooks/use-caller";
import { isNativeApp } from "@/lib/platform";

type Filter = "all" | "no_order" | "order_placed" | "unknown";

const dayLabel = (date: Date) =>
  isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEE d MMM");

export default function Calls() {
  const { selectedLocationId } = useLocationStore();
  const { showCaller } = useCaller();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const { data: calls = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/calls", selectedLocationId],
    queryFn: async () => {
      const res = await fetch(`/api/calls?limit=300${selectedLocationId ? `&locationId=${selectedLocationId}` : ""}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    enabled: !!selectedLocationId,
    refetchInterval: 15000,
  });

  const stats = useMemo(() => {
    const today = calls.filter((c) => isToday(new Date(c.createdAt)));
    const ordered = today.filter((c) => c.outcome === "order_placed").length;
    return {
      today: today.length,
      ordered,
      noOrder: today.length - ordered,
      unknown: today.filter((c) => !c.customerId).length,
    };
  }, [calls]);

  const filtered = useMemo(() => {
    const q = search.replace(/\s/g, "").toLowerCase();
    return calls.filter((c) => {
      if (filter === "unknown" && c.customerId) return false;
      if ((filter === "no_order" || filter === "order_placed") && c.outcome !== filter) return false;
      if (!q) return true;
      return c.phone.replace(/\s/g, "").includes(q) || (c.customerName ?? "").toLowerCase().includes(q);
    });
  }, [calls, filter, search]);

  const filters: Array<[Filter, string]> = [
    ["all", "All"],
    ["no_order", "No order"],
    ["order_placed", "Ordered"],
    ["unknown", "Unknown callers"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call history</h1>
        <p className="text-muted-foreground">
          Every incoming call picked up by the Restaurant POS Android app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PhoneIncoming} label="Calls today" value={stats.today} />
        <StatCard icon={CheckCircle2} label="Turned into orders" value={stats.ordered} />
        <StatCard icon={PhoneMissed} label="No order" value={stats.noOrder} />
        <StatCard icon={Search} label="Unknown callers" value={stats.unknown} />
      </div>

      <Card>
        <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Recent calls</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {filters.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}>
                  <Badge variant={filter === key ? "default" : "outline"}>{label}</Badge>
                </button>
              ))}
            </div>
            <Input
              className="sm:w-56"
              placeholder="Search number or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-calls"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <EmptyState
              icon={PhoneCall}
              title="No calls yet"
              description={
                isNativeApp()
                  ? "Calls to this phone will be listed here."
                  : "Install the Restaurant POS Android app on the phone that takes orders. Its incoming calls will be listed here."
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching calls" description="Try another filter or search." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((call) => {
                  const at = new Date(call.createdAt);
                  return (
                    <TableRow key={call.id} data-testid={`row-call-${call.id}`}>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">{dayLabel(at)}</span>
                        <span className="text-muted-foreground"> · {format(at, "h:mm a")}</span>
                      </TableCell>
                      <TableCell>
                        {call.customerName ?? <span className="text-muted-foreground">Unknown caller</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{call.phone}</TableCell>
                      <TableCell>
                        {call.outcome === "order_placed" ? (
                          <Badge className="bg-green-600 hover:bg-green-600">Ordered</Badge>
                        ) : (
                          <Badge variant="outline">No order</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => showCaller(call.phone)}>
                          View caller
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof PhoneCall; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
