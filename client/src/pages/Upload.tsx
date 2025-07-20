import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import FileUploader from "@/components/FileUploader";

export default function Upload() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
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
  }, [isAuthenticated, authLoading, toast]);

  // Check permissions
  useEffect(() => {
    if (user && !authLoading) {
      const canUpload = user.role === 'admin' || user.role === 'uploader';
      if (!canUpload) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to upload files.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }
    }
  }, [user, authLoading, toast]);

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

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const canUpload = user.role === 'admin' || user.role === 'uploader';
  if (!canUpload) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Import Data"
          description="Upload Excel (.xlsx, .xls) or CSV files to import contact data."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <FileUploader />
        </main>
      </div>
    </div>
  );
}
