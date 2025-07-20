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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserPlus, 
  Settings, 
  Shield, 
  Users, 
  Building,
  Calendar,
  Mail
} from "lucide-react";

export default function UserManagement() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);

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
        description: "Only administrators can access user management.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: divisions } = useQuery({
    queryKey: ["/api/divisions"],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      return await apiRequest('PATCH', `/api/users/${userId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
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

  const assignDivisionMutation = useMutation({
    mutationFn: async ({ userId, divisionId, canManage }: { userId: string; divisionId: number; canManage: boolean }) => {
      return await apiRequest('POST', `/api/users/${userId}/divisions`, {
        divisionId,
        canManage,
      });
    },
    onSuccess: () => {
      toast({
        title: "Division assigned",
        description: "User has been assigned to the division successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDivisionDialogOpen(false);
      setSelectedUser(null);
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
        title: "Assignment failed",
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'uploader':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUserInitials = (userData: any) => {
    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || userData.email?.charAt(0).toUpperCase() || "U";
  };

  const handleRoleUpdate = (newRole: string) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        updates: { role: newRole },
      });
    }
  };

  const handleDivisionAssignment = (divisionId: string, canManage: boolean = false) => {
    if (selectedUser) {
      assignDivisionMutation.mutate({
        userId: selectedUser.id,
        divisionId: parseInt(divisionId),
        canManage,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="User Management"
          description="Manage user roles, permissions, and division access."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Administrators</p>
                    <p className="text-2xl font-bold">
                      {users?.filter((u: any) => u.role === 'admin').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uploaders</p>
                    <p className="text-2xl font-bold">
                      {users?.filter((u: any) => u.role === 'uploader').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Building className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Divisions</p>
                    <p className="text-2xl font-bold">{divisions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user roles and division permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : users?.length ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Divisions</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData: any) => (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={userData.profileImageUrl || ""} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {getUserInitials(userData)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {userData.firstName && userData.lastName 
                                    ? `${userData.firstName} ${userData.lastName}`
                                    : 'Unknown Name'
                                  }
                                </p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {userData.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(userData.role)} className="capitalize">
                              {userData.role}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userData.divisions?.map((div: any) => (
                                <Badge key={div.id} variant="outline" className="text-xs">
                                  {div.name}
                                  {div.canManage && <span className="ml-1">*</span>}
                                </Badge>
                              )) || <span className="text-muted-foreground">None</span>}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(userData.createdAt)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog open={isRoleDialogOpen && selectedUser?.id === userData.id} onOpenChange={setIsRoleDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedUser(userData)}
                                  >
                                    <Settings className="w-3 h-3 mr-1" />
                                    Role
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update User Role</DialogTitle>
                                    <DialogDescription>
                                      Change the role for {userData.firstName} {userData.lastName}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="py-4">
                                    <Select defaultValue={userData.role} onValueChange={handleRoleUpdate}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">User - View only access</SelectItem>
                                        <SelectItem value="uploader">Uploader - Can upload and view</SelectItem>
                                        <SelectItem value="admin">Admin - Full access</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={isDivisionDialogOpen && selectedUser?.id === userData.id} onOpenChange={setIsDivisionDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedUser(userData)}
                                  >
                                    <Building className="w-3 h-3 mr-1" />
                                    Divisions
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Manage Division Access</DialogTitle>
                                    <DialogDescription>
                                      Assign {userData.firstName} {userData.lastName} to divisions
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="py-4 space-y-4">
                                    <Select onValueChange={(value) => handleDivisionAssignment(value, false)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select division to assign..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {divisions?.map((division: any) => (
                                          <SelectItem key={division.id} value={division.id.toString()}>
                                            {division.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    
                                    <div className="text-sm text-muted-foreground">
                                      Current divisions: {userData.divisions?.map((d: any) => d.name).join(', ') || 'None'}
                                    </div>
                                  </div>
                                  
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDivisionDialogOpen(false)}>
                                      Close
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    Users will appear here once they sign in to the application.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
