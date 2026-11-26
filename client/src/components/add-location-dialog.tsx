import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Location } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-location";
import { apiRequest, queryClient } from "@/lib/queryClient";

/** "+" button that opens a form to create a new restaurant location. */
export function AddLocationDialog() {
  const { toast } = useToast();
  const { setSelectedLocationId } = useLocationStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Enter a name for the location.");
      if (!address.trim()) throw new Error("Enter the address.");
      const res = await apiRequest("POST", "/api/locations", {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
        active: true,
      });
      return (await res.json()) as Location;
    },
    onSuccess: (location) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setSelectedLocationId(location.id);
      toast({ title: "Location added", description: `Now viewing ${location.name}.` });
      setName("");
      setAddress("");
      setPhone("");
      setOpen(false);
    },
    onError: (error: Error) => toast({ title: "Couldn't add location", description: error.message, variant: "destructive" }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title="Add location"
        aria-label="Add location"
        data-testid="button-add-location"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add location</DialogTitle>
            <DialogDescription>Add another branch of your restaurant.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Name</Label>
              <Input
                id="location-name"
                placeholder="e.g. Sydney CBD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-location-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-address">Address</Label>
              <Input
                id="location-address"
                placeholder="1 George St, Sydney NSW 2000"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-testid="input-location-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-phone">Phone (optional)</Label>
              <Input
                id="location-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-location-phone"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending} data-testid="button-save-location">
                {create.isPending ? "Adding…" : "Add location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
