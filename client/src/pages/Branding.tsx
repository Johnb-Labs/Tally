import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import BrandingEditor from "@/components/BrandingEditor";

export default function Branding() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can access branding settings.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Branding & Customization"
          description="Customize the appearance and branding of your application."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <BrandingEditor />
        </main>
      </div>
    </div>
  );
}
