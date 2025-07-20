import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandProvider } from "@/contexts/BrandContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import FieldMapping from "@/pages/FieldMapping";
import Contacts from "@/pages/Contacts";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import Branding from "@/pages/Branding";
import Divisions from "@/pages/Divisions";
import AuditLog from "@/pages/AuditLog";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/upload" component={Upload} />
          <Route path="/field-mapping" component={FieldMapping} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/reports" component={Reports} />
          <Route path="/users" component={UserManagement} />
          <Route path="/branding" component={Branding} />
          <Route path="/divisions" component={Divisions} />
          <Route path="/audit" component={AuditLog} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
