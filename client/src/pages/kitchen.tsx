import { KitchenDisplay } from "@/components/kitchen-display";

export default function Kitchen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kitchen Display</h1>
        <p className="text-muted-foreground">Active orders for kitchen staff</p>
      </div>

      <KitchenDisplay />
    </div>
  );
}
