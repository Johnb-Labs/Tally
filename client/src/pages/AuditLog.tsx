import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  History, 
  Search, 
  Filter,
  User,
  Upload,
  Settings,
  Shield,
  Building,
  FileText,
  Calendar,
  Clock,
  Eye,
  AlertCircle
} from "lucide-react";

interface AuditLogEntry {
  id: number;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  divisionId: number | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  division?: {
    id: number;
    name: string;
  };
}

export default function AuditLog() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7days");

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
        description: "Only administrators can access audit logs.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/audit-logs", { limit: 100 }],
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === 'admin',
    retry: false,
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

  // Filter audit logs based on current filters
  const filteredLogs = auditLogs?.filter((log: AuditLogEntry) => {
    const matchesSearch = !searchQuery || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;
    const matchesUser = userFilter === "all" || log.userId === userFilter;

    // Date filtering (simplified for demo)
    const matchesDate = true; // In real implementation, filter by dateRange

    return matchesSearch && matchesAction && matchesEntity && matchesUser && matchesDate;
  }) || [];

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <Upload className="w-4 h-4 text-green-500" />;
    if (action.includes('updated')) return <Settings className="w-4 h-4 text-blue-500" />;
    if (action.includes('deleted')) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (action.includes('login')) return <Shield className="w-4 h-4 text-purple-500" />;
    return <History className="w-4 h-4 text-gray-500" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('created')) return <Badge variant="default">Created</Badge>;
    if (action.includes('updated')) return <Badge variant="secondary">Updated</Badge>;
    if (action.includes('deleted')) return <Badge variant="destructive">Deleted</Badge>;
    if (action.includes('login')) return <Badge variant="outline">Login</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user': return <User className="w-4 h-4" />;
      case 'contact': return <User className="w-4 h-4" />;
      case 'division': return <Building className="w-4 h-4" />;
      case 'upload': return <Upload className="w-4 h-4" />;
      case 'branding_settings': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getUserInitials = (userData: any) => {
    if (!userData) return "?";
    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || userData.email?.charAt(0).toUpperCase() || "U";
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatActionDescription = (log: AuditLogEntry) => {
    const entityName = log.entityType.replace('_', ' ');
    return `${log.action.replace('_', ' ')} ${entityName}${log.entityId ? ` #${log.entityId}` : ''}`;
  };

  // Get unique values for filters
  const uniqueActions = [...new Set(auditLogs?.map((log: AuditLogEntry) => log.action.split('_')[0]) || [])];
  const uniqueEntities = [...new Set(auditLogs?.map((log: AuditLogEntry) => log.entityType) || [])];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Audit Log"
          description="Monitor user activities and system changes for security and compliance."
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filters & Search</span>
              </CardTitle>
              <CardDescription>
                Filter audit log entries by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search actions, users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Action Filter */}
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Entity Filter */}
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {uniqueEntities.map(entity => (
                      <SelectItem key={entity} value={entity}>
                        {entity.replace('_', ' ').charAt(0).toUpperCase() + entity.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User Filter */}
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users?.map((userData: any) => (
                      <SelectItem key={userData.id} value={userData.id}>
                        {userData.firstName && userData.lastName 
                          ? `${userData.firstName} ${userData.lastName}`
                          : userData.email
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Summary */}
              {(searchQuery || actionFilter !== "all" || entityFilter !== "all" || userFilter !== "all") && (
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">
                      Search: {searchQuery}
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {actionFilter !== "all" && (
                    <Badge variant="secondary">
                      Action: {actionFilter}
                      <button 
                        onClick={() => setActionFilter("all")}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {entityFilter !== "all" && (
                    <Badge variant="secondary">
                      Entity: {entityFilter}
                      <button 
                        onClick={() => setEntityFilter("all")}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setActionFilter("all");
                      setEntityFilter("all");
                      setUserFilter("all");
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Log Entries</CardTitle>
                  <CardDescription>
                    {filteredLogs.length} of {auditLogs?.length || 0} entries shown
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Export Log
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log: AuditLogEntry) => {
                        const dateTime = formatDateTime(log.createdAt);
                        return (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={log.user?.profileImageUrl || ""} />
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getUserInitials(log.user)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {log.user?.firstName && log.user?.lastName 
                                      ? `${log.user.firstName} ${log.user.lastName}`
                                      : log.user?.email || 'Unknown User'
                                    }
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.user?.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getActionIcon(log.action)}
                                {getActionBadge(log.action)}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getEntityIcon(log.entityType)}
                                <span className="text-sm capitalize">
                                  {log.entityType.replace('_', ' ')}
                                </span>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">
                                  {formatActionDescription(log)}
                                </p>
                                {log.division && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Building className="w-3 h-3 mr-1" />
                                    {log.division.name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {dateTime.date}
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {dateTime.time}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {log.ipAddress || '—'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {auditLogs?.length ? "No matching entries" : "No audit logs found"}
                  </h3>
                  <p className="text-muted-foreground">
                    {auditLogs?.length 
                      ? "Try adjusting your filters to see more results."
                      : "User activities and system changes will appear here."
                    }
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
