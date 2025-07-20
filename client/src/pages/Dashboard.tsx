import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import StatsCard from "@/components/StatsCard";
import ContactGrowthChart from "@/components/ContactGrowthChart";
import ContactTypesChart from "@/components/ContactTypesChart";
import { DivisionSelector } from "@/components/DivisionSelector";
import CompanyDashboard from "./CompanyDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Mail, 
  Phone, 
  Tags, 
  FileUp,
  Search,
  BarChart3,
  UserCog,
  CloudUpload,
  FileSpreadsheet,
  Globe,
  Download
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentDivision } = useBrand();
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState<number | "all">();

  // Check if user can see company view (admin/exco)
  const canAccessCompanyView = (user as any)?.role === 'admin' || (user as any)?.role === 'exco';

  useEffect(() => {
    // Set default view based on user role and current division
    if (currentDivision?.id && !canAccessCompanyView) {
      setSelectedView(currentDivision.id);
    } else if (canAccessCompanyView) {
      setSelectedView("all"); // Default to company view for admin/exco
    }
  }, [currentDivision, canAccessCompanyView]);

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

  // Division-specific queries (only when not showing company view)
  const { data: contactStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/contacts/stats", { divisionId: typeof selectedView === 'number' ? selectedView : currentDivision?.id }],
    enabled: !!user && selectedView !== "all",
    retry: false,
  });

  const { data: recentUploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ["/api/uploads", { divisionId: typeof selectedView === 'number' ? selectedView : currentDivision?.id, limit: 5 }],
    enabled: !!user && selectedView !== "all",
    retry: false,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/contact-categories", { divisionId: typeof selectedView === 'number' ? selectedView : currentDivision?.id }],
    enabled: !!user && selectedView !== "all",
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

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const isAdmin = (user as any).role === 'admin';
  const canUpload = (user as any).role === 'admin' || (user as any).role === 'uploader';

  const statsData = contactStats ? [
    {
      label: "Total Contacts",
      value: (contactStats as any).total.toLocaleString(),
      change: "+12.5%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Email Addresses",
      value: (contactStats as any).withEmail.toLocaleString(),
      change: "+8.2%",
      icon: Mail,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Phone Numbers",
      value: (contactStats as any).withPhone.toLocaleString(),
      change: "-2.1%",
      icon: Phone,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Active Categories",
      value: (categories as any)?.length.toString() || "0",
      change: "+3",
      icon: Tags,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ] : [];

  // Show company dashboard for company view
  if (selectedView === "all") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopHeader 
            title="Dashboard"
            description="Company-wide overview across all divisions"
            actions={
              <div className="flex items-center space-x-3">
                {canAccessCompanyView && (
                  <DivisionSelector
                    value={selectedView}
                    onValueChange={setSelectedView}
                    showAllOption={true}
                  />
                )}
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            }
          />
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <CompanyDashboard />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Dashboard"
          description="Welcome back! Here's your data overview."
          actions={
            <div className="flex items-center space-x-3">
              {canAccessCompanyView && (
                <DivisionSelector
                  value={selectedView}
                  onValueChange={setSelectedView}
                  showAllOption={true}
                />
              )}
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : (
              statsData.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContactGrowthChart />
            <ContactTypesChart categories={categories as any} />
          </div>

          {/* Data Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Uploads */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Uploads</CardTitle>
                  <CardDescription>Latest file uploads and their status</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadsLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : (recentUploads as any)?.length ? (
                  (recentUploads as any).map((upload: any) => (
                    <div key={upload.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{upload.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {upload.recordsTotal ? `${upload.recordsTotal.toLocaleString()} contacts` : 'Processing'} • {
                              new Date(upload.createdAt!).toLocaleDateString()
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        upload.status === 'completed' ? 'default' : 
                        upload.status === 'processing' ? 'secondary' : 
                        upload.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {upload.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No uploads yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Contact distribution by category</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoriesLoading ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-muted rounded-full"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-4 bg-muted rounded w-12"></div>
                        <div className="w-16 bg-muted rounded-full h-2"></div>
                      </div>
                    </div>
                  ))
                ) : (categories as any)?.length ? (
                  (categories as any).slice(0, 5).map((category: any) => {
                    const categoryStats = (contactStats as any)?.byCategory.find((c: any) => c.categoryId === category.id);
                    const count = categoryStats?.count || 0;
                    const total = (contactStats as any)?.total || 1;
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-muted-foreground">{count.toLocaleString()}</span>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${percentage}%`, 
                                backgroundColor: category.color || '#3B82F6' 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tags className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No categories configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {canUpload && (
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => window.location.href = "/upload"}
                  >
                    <div className="flex items-center space-x-3">
                      <CloudUpload className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">Upload New File</p>
                        <p className="text-sm text-muted-foreground">Excel or CSV</p>
                      </div>
                    </div>
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start"
                  onClick={() => window.location.href = "/contacts"}
                >
                  <div className="flex items-center space-x-3">
                    <Search className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Search Contacts</p>
                      <p className="text-sm text-muted-foreground">Find specific records</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start"
                  onClick={() => window.location.href = "/reports"}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Generate Report</p>
                      <p className="text-sm text-muted-foreground">Custom analytics</p>
                    </div>
                  </div>
                </Button>

                {isAdmin && (
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => window.location.href = "/users"}
                  >
                    <div className="flex items-center space-x-3">
                      <UserCog className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">Manage Users</p>
                        <p className="text-sm text-muted-foreground">Roles & permissions</p>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
