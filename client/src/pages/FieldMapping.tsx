import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import FieldMapper from "@/components/FieldMapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Clock, CheckCircle, AlertCircle, Play } from "lucide-react";

export default function FieldMapping() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUpload, setSelectedUpload] = useState<any>(null);

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
      const canUpload = (user as any)?.role === 'admin' || (user as any)?.role === 'uploader';
      if (!canUpload) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access field mapping.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }
    }
  }, [user, authLoading, toast]);

  const { data: uploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ["/api/uploads"],
    enabled: !!user,
    retry: false,
  });

  const processMutation = useMutation({
    mutationFn: async ({ uploadId, fieldMapping, divisionId }: { uploadId: number; fieldMapping: any; divisionId?: number }) => {
      return await apiRequest('PATCH', `/api/uploads/${uploadId}`, {
        status: 'processing',
        fieldMapping,
        divisionId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Processing started",
        description: "The file is being processed with your field mapping.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      setSelectedUpload(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      return await apiRequest('DELETE', `/api/uploads/${uploadId}`);
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "The uploaded file has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      setSelectedUpload(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const canUpload = (user as any)?.role === 'admin' || (user as any)?.role === 'uploader';
  if (!canUpload) {
    return null; // Will redirect in useEffect
  }

  const uploadsArray = Array.isArray(uploads) ? uploads : [];
  const pendingUploads = uploadsArray.filter((upload: any) => upload.status === 'pending');
  const processingUploads = uploadsArray.filter((upload: any) => upload.status === 'processing');
  const completedUploads = uploadsArray.filter((upload: any) => upload.status === 'completed');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'secondary',
      completed: 'default',
      failed: 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-[#ffffff]">
        {status}
      </Badge>
    );
  };

  const handleFieldMappingComplete = (data: any) => {
    if (selectedUpload) {
      processMutation.mutate({
        uploadId: selectedUpload.id,
        fieldMapping: data.fieldMapping,
        divisionId: data.divisionId,
      });
    }
  };

  const handleDeleteUpload = (uploadId: number) => {
    // Show confirmation dialog before deleting
    if (window.confirm("Are you sure you want to delete this uploaded file? This action cannot be undone.")) {
      deleteMutation.mutate(uploadId);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Field Mapping"
          description="Map CSV/Excel fields to contact database fields and process uploads."
        />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedUpload ? (
            <FieldMapper 
              upload={selectedUpload}
              onComplete={handleFieldMappingComplete}
              onCancel={() => setSelectedUpload(null)}
              onDelete={handleDeleteUpload}
              isProcessing={processMutation.isPending}
            />
          ) : (
            <>
              {/* Pending Uploads */}
              {pendingUploads.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Field Mapping</CardTitle>
                    <CardDescription>
                      Files waiting for field mapping configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingUploads.map((upload: any) => (
                        <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                            <div>
                              <p className="font-medium">{upload.originalName}</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded {new Date(upload.createdAt).toLocaleDateString()} • {
                                  (upload.fileSize / 1024 / 1024).toFixed(2)
                                } MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(upload.status)}
                            {getStatusBadge(upload.status)}
                            <Button 
                              onClick={() => setSelectedUpload(upload)}
                              size="sm"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Map Fields
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processing Uploads */}
              {processingUploads.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Currently Processing</CardTitle>
                    <CardDescription>
                      Files being processed with field mappings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {processingUploads.map((upload: any) => (
                        <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileSpreadsheet className="w-8 h-8 text-orange-500" />
                            <div>
                              <p className="font-medium">{upload.originalName}</p>
                              <p className="text-sm text-muted-foreground">
                                Processing in progress...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(upload.status)}
                            {getStatusBadge(upload.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Completed */}
              {completedUploads.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Completed</CardTitle>
                    <CardDescription>
                      Successfully processed uploads
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Records</TableHead>
                            <TableHead>Completed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedUploads.slice(0, 10).map((upload: any) => (
                            <TableRow key={upload.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                                  <span className="font-medium">{upload.originalName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(upload.status)}
                                  {getStatusBadge(upload.status)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {upload.recordsImported ? (
                                  <span className="text-green-600 font-medium">
                                    {upload.recordsImported.toLocaleString()} imported
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {upload.completedAt ? new Date(upload.completedAt).toLocaleDateString() : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {uploadsLoading ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading uploads...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : !uploadsArray.length ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <FileSpreadsheet className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No uploads found</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload files first to configure field mappings.
                      </p>
                      <Button onClick={() => window.location.href = "/upload"}>
                        Go to Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
