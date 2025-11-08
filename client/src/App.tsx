import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MenuManagement from "@/pages/menu-management";
import Orders from "@/pages/orders";
import POS from "@/pages/pos";
import Kitchen from "@/pages/kitchen";
import Tables from "@/pages/tables";
import Reservations from "@/pages/reservations";
import Staff from "@/pages/staff";
import Customers from "@/pages/customers";
import Reports from "@/pages/reports";
import QRMenu from "@/pages/qr-menu";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/menu" component={MenuManagement} />
      <Route path="/orders" component={Orders} />
      <Route path="/pos" component={POS} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/tables" component={Tables} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/staff" component={Staff} />
      <Route path="/customers" component={Customers} />
      <Route path="/reports" component={Reports} />
      <Route path="/qr-menu" component={QRMenu} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
