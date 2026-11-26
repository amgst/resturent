import { Switch, Route, useLocation } from "wouter";
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
import CustomerMenu from "@/pages/customer-menu";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { CallerLookup } from "@/components/caller-lookup";

function AdminRouter() {
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

function AppContent() {
  const [location] = useLocation();
  const isCustomerView = location === "/customer-menu";

  if (isCustomerView) {
    return <CustomerMenu />;
  }

  return <StaffArea />;
}

function StaffArea() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline" data-testid="text-user-email">
                {user.email}
              </span>
              <CallerLookup />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                data-testid="button-sign-out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <AdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
