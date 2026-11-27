import { useMutation } from "@tanstack/react-query";
import { Pizza, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cleanError } from "@/components/customer-profile-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-location";
import { apiRequest, queryClient } from "@/lib/queryClient";

/** Settings → Demo data: load or remove the sample pizzeria. */
export function DemoDataCard() {
  const { toast } = useToast();
  const { setSelectedLocationId } = useLocationStore();

  const load = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/demo-data");
      return (await res.json()) as { locationId: string; counts: Record<string, number> };
    },
    onSuccess: ({ locationId, counts }) => {
      setSelectedLocationId(locationId);
      queryClient.invalidateQueries();
      toast({
        title: "Demo pizzeria loaded",
        description: `${counts.menuItems} menu items, ${counts.customers} customers, ${counts.orders} orders and ${counts.callLogs} calls. Now viewing "Bella Napoli (Demo)".`,
      });
    },
    onError: (error: Error) => toast({ title: "Couldn't load demo", description: cleanError(error), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/demo-data");
      return (await res.json()) as { removed: number };
    },
    onSuccess: ({ removed }) => {
      queryClient.invalidateQueries();
      toast({ title: "Demo data removed", description: `${removed} demo records deleted. Your own data wasn't touched.` });
    },
    onError: (error: Error) => toast({ title: "Couldn't remove demo", description: cleanError(error), variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="h-5 w-5 text-primary" /> Pizza shop demo
        </CardTitle>
        <CardDescription>
          Fill the app with a realistic sample pizzeria to try features or show it to a customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• New location "Bella Napoli (Demo)" with its own branding</li>
          <li>• 24 pizzas, sides, desserts and drinks with pictures</li>
          <li>• 12 tables, 6 staff, upcoming reservations</li>
          <li>• 30 customers with tags, allergies and addresses</li>
          <li>• A month of orders, including live ones for the kitchen</li>
          <li>• Two weeks of call history</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Demo records are labelled, so removing them never deletes your real data. The demo menu items
          show in every location's menu until you remove them.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => load.mutate()} disabled={load.isPending} data-testid="button-load-demo">
            <Pizza className="mr-2 h-4 w-4" />
            {load.isPending ? "Loading demo…" : "Load pizza demo"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={remove.isPending} data-testid="button-remove-demo">
                <Trash2 className="mr-2 h-4 w-4" />
                {remove.isPending ? "Removing…" : "Remove demo data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove all demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes the demo location and its menu, customers, orders, reservations and call history.
                  Records you created yourself are kept.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.mutate()} data-testid="button-confirm-remove-demo">
                  Remove demo data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
