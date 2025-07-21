import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
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
import { Search, Mail, Phone, Building, User, Calendar, Trash2, CheckSquare, Square } from "lucide-react";

export default function Contacts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

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

  const { data: categories } = useQuery({
    queryKey: ["/api/contact-categories"],
    enabled: !!user,
    retry: false,
  });

  // Delete single contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return await apiRequest('DELETE', `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      toast({
        title: "Contact deleted",
        description: "Contact has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
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

  // Bulk delete contacts
  const bulkDeleteMutation = useMutation({
    mutationFn: async (contactIds: number[]) => {
      return await apiRequest('DELETE', '/api/contacts', { contactIds });
    },
    onSuccess: (data) => {
      toast({
        title: "Contacts deleted",
        description: `${data.deletedCount} contacts have been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setSelectedContacts([]);
      setIsSelectMode(false);
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
        title: "Bulk delete failed",
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

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || "Uncategorized";
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId || !categories) return "#6B7280";
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.color || "#6B7280";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Selection handlers
  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && contacts) {
      setSelectedContacts(contacts.map((contact: any) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleDeleteContact = (contactId: number) => {
    if (window.confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedContacts.length === 0) return;
    
    const message = selectedContacts.length === 1 
      ? "Are you sure you want to delete this contact? This action cannot be undone."
      : `Are you sure you want to delete ${selectedContacts.length} contacts? This action cannot be undone.`;
    
    if (window.confirm(message)) {
      bulkDeleteMutation.mutate(selectedContacts);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedContacts([]);
  };

  // Check if user has admin or uploader role
  const canDelete = user && (user.role === 'admin' || user.role === 'uploader');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Contacts"
          description="Manage and search through your contact database."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <CardTitle className="flex items-center space-x-3">
                    Contact Directory
                    {canDelete && (
                      <Button
                        variant={isSelectMode ? "destructive" : "outline"}
                        size="sm"
                        onClick={toggleSelectMode}
                        className="ml-[17px] mr-[17px]"
                      >
                        {isSelectMode ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Select
                          </>
                        )}
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {contacts 
                      ? `${contacts.length} contacts found${isSelectMode && selectedContacts.length > 0 ? ` (${selectedContacts.length} selected)` : ''}`
                      : "Loading contacts..."
                    }
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Bulk Actions */}
                  {isSelectMode && selectedContacts.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete {selectedContacts.length} {selectedContacts.length === 1 ? 'Contact' : 'Contacts'}
                    </Button>
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
              ) : contacts?.length ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isSelectMode && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={contacts && selectedContacts.length === contacts.length}
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            />
                          </TableHead>
                        )}
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Added</TableHead>
                        {canDelete && !isSelectMode && (
                          <TableHead className="w-12"></TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact: any) => (
                        <TableRow key={contact.id}>
                          {isSelectMode && (
                            <TableCell>
                              <Checkbox
                                checked={selectedContacts.includes(contact.id)}
                                onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
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
                                borderColor: getCategoryColor(contact.categoryId),
                                color: getCategoryColor(contact.categoryId)
                              }}
                            >
                              {getCategoryName(contact.categoryId)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(contact.createdAt)}</span>
                            </div>
                          </TableCell>
                          
                          {canDelete && !isSelectMode && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContact(contact.id)}
                                disabled={deleteContactMutation.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No contacts found" : "No contacts yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? `No contacts match "${searchQuery}". Try a different search term.`
                      : "Start by uploading your first contact file to see contacts here."
                    }
                  </p>
                  {!searchQuery && (user.role === 'admin' || user.role === 'uploader') && (
                    <Button onClick={() => window.location.href = "/upload"}>
                      Upload Contacts
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
