import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Mail, Phone, Building, User, Calendar, Trash2, X } from "lucide-react";

export default function Contacts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Check if user can delete contacts (admin or uploader)
  const canDeleteContacts = (user as any)?.role === 'admin' || (user as any)?.role === 'uploader';

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts", { search: debouncedQuery || undefined }],
    enabled: !!user,
    retry: false,
  });

  const { data: divisions } = useQuery({
    queryKey: ["/api/divisions"],
    enabled: !!user,
    retry: false,
  });

  // Single contact deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (contactId: number) => {
      await apiRequest(`/api/contacts/${contactId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/stats"] });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
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
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  // Bulk deletion mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (contactIds: number[]) => {
      await apiRequest("/api/contacts", "DELETE", { ids: contactIds });
    },
    onSuccess: (_, contactIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/stats"] });
      setSelectedContacts([]);
      setSelectAll(false);
      toast({
        title: "Success",
        description: `${contactIds.length} contacts deleted successfully`,
      });
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
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    },
  });

  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && contacts && Array.isArray(contacts)) {
      setSelectedContacts(contacts.map((contact: any) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleDeleteContact = (contactId: number) => {
    deleteMutation.mutate(contactId);
  };

  const handleBulkDelete = () => {
    if (selectedContacts.length > 0) {
      bulkDeleteMutation.mutate(selectedContacts);
    }
  };

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

  const getDivisionName = (divisionId: number | null) => {
    if (!divisionId || !divisions || !Array.isArray(divisions)) return "No Division";
    const division = divisions.find((d: any) => d.id === divisionId);
    return division?.name || "No Division";
  };

  const getDivisionColor = (divisionId: number | null) => {
    if (!divisionId || !divisions || !Array.isArray(divisions)) return "#6B7280";
    const division = divisions.find((d: any) => d.id === divisionId);
    return division?.primaryColor || "#6B7280";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AppLayout>
      
      
      
        <TopHeader 
          title="Contacts"
          description="Manage and search through your contact database."
        />
        
        <div className="p-4 sm:p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <CardTitle>Contact Directory</CardTitle>
                  <CardDescription>
                    {contacts && Array.isArray(contacts) ? `${contacts.length} contacts found` : "Loading contacts..."}
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Bulk Actions */}
                  {canDeleteContacts && selectedContacts.length > 0 && (
                    <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        {selectedContacts.length} selected
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={bulkDeleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Selected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contacts</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {selectedContacts.length} selected contacts? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleBulkDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete {selectedContacts.length} Contacts
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContacts([]);
                          setSelectAll(false);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Search */}
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {contactsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : contacts && Array.isArray(contacts) && contacts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {canDeleteContacts && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                        )}
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Added</TableHead>
                        {canDeleteContacts && <TableHead className="w-12"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(contacts as any[]).map((contact: any) => (
                        <TableRow key={contact.id}>
                          {canDeleteContacts && (
                            <TableCell>
                              <Checkbox
                                checked={selectedContacts.includes(contact.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectContact(contact.id, checked as boolean)
                                }
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {contact.firstName || contact.lastName 
                                    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                    : 'Unknown Name'
                                  }
                                </p>
                                {contact.jobTitle && (
                                  <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {contact.email ? (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{contact.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {contact.phone ? (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{contact.phone}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {contact.company ? (
                              <div className="flex items-center space-x-2">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{contact.company}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: getDivisionColor(contact.divisionId),
                                color: getDivisionColor(contact.divisionId)
                              }}
                            >
                              {getDivisionName(contact.divisionId)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(contact.createdAt)}</span>
                            </div>
                          </TableCell>

                          {canDeleteContacts && (
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{contact.firstName} {contact.lastName}"? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteContact(contact.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Contact
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? "Try adjusting your search criteria" 
                      : "Import contacts using the Upload feature to get started"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
  );
}