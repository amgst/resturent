import { POSInterface } from "@/components/pos-interface";

export default function POS() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">POS System</h1>
        <p className="text-muted-foreground">Process orders and payments</p>
      </div>

      <POSInterface />
    </div>
  );
}
