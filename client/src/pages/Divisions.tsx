import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building, 
  Plus, 
  Settings, 
  Users, 
  Upload,
  Palette,
  Eye,
  Trash2
} from "lucide-react";

export default function Divisions() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    primaryColor: '#1976D2',
    secondaryColor: '#424242',
  });

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
        description: "Only administrators can access division management.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: divisions, isLoading: divisionsLoading } = useQuery({
    queryKey: ["/api/divisions"],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const createDivisionMutation = useMutation({
    mutationFn: async (divisionData: any) => {
      return await apiRequest('POST', '/api/divisions', divisionData);
    },
    onSuccess: () => {
      toast({
        title: "Division created",
        description: "The division has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/divisions"] });
      setIsCreateDialogOpen(false);
      resetForm();
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
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDivisionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/divisions/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Division updated",
        description: "The division has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/divisions"] });
      setIsEditDialogOpen(false);
      setSelectedDivision(null);
      resetForm();
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
        title: "Update failed",
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

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      primaryColor: '#1976D2',
      secondaryColor: '#424242',
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Division name is required.",
        variant: "destructive",
      });
      return;
    }
    createDivisionMutation.mutate(formData);
  };

  const handleEdit = (division: any) => {
    setSelectedDivision(division);
    setFormData({
      name: division.name || '',
      description: division.description || '',
      logoUrl: division.logoUrl || '',
      primaryColor: division.primaryColor || '#1976D2',
      secondaryColor: division.secondaryColor || '#424242',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Division name is required.",
        variant: "destructive",
      });
      return;
    }
    updateDivisionMutation.mutate({
      id: selectedDivision.id,
      data: formData,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Division Management"
          description="Manage organizational divisions with custom branding and permissions."
          actions={
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Division
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Division</DialogTitle>
                  <DialogDescription>
                    Set up a new division with custom branding and settings.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="create-name">Division Name *</Label>
                    <Input
                      id="create-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter division name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="create-description">Description</Label>
                    <Textarea
                      id="create-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this division's purpose"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="create-logo">Logo URL</Label>
                    <Input
                      id="create-logo"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-primary">Primary Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="color"
                          id="create-primary"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-10 h-8 border border-input rounded cursor-pointer"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#1976D2"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="create-secondary">Secondary Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="color"
                          id="create-secondary"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-10 h-8 border border-input rounded cursor-pointer"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#424242"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={createDivisionMutation.isPending}
                  >
                    {createDivisionMutation.isPending ? 'Creating...' : 'Create Division'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Building className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Divisions</p>
                    <p className="text-2xl font-bold">{divisions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">—</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Upload className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Uploads</p>
                    <p className="text-2xl font-bold">—</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Palette className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custom Branded</p>
                    <p className="text-2xl font-bold">
                      {divisions?.filter((d: any) => d.logoUrl || d.primaryColor !== '#1976D2').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Divisions Grid */}
          <Card>
            <CardHeader>
              <CardTitle>All Divisions</CardTitle>
              <CardDescription>
                Manage divisions and their branding settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {divisionsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-48 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : divisions?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {divisions.map((division: any) => (
                    <Card key={division.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {division.logoUrl ? (
                              <img 
                                src={division.logoUrl} 
                                alt={division.name}
                                className="w-10 h-10 object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: division.primaryColor || '#1976D2' }}
                              >
                                <Building className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">{division.name}</h3>
                              <Badge variant={division.isActive ? 'default' : 'secondary'}>
                                {division.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(division)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {division.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {division.description}
                          </p>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Created</span>
                            <span>{formatDate(division.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Colors</span>
                            <div className="flex space-x-1">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: division.primaryColor || '#1976D2' }}
                              ></div>
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: division.secondaryColor || '#424242' }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Users className="w-3 h-3 mr-1" />
                              Users
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No divisions created</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first division to organize users and customize branding.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Division
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Division</DialogTitle>
            <DialogDescription>
              Update division settings and branding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Division Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter division name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this division's purpose"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-primary">Primary Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="color"
                    id="edit-primary"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-8 border border-input rounded cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#1976D2"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-secondary">Secondary Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="color"
                    id="edit-secondary"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-8 border border-input rounded cursor-pointer"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#424242"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateDivisionMutation.isPending}
            >
              {updateDivisionMutation.isPending ? 'Updating...' : 'Update Division'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
