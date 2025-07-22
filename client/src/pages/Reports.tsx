import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  Mail, 
  Phone,
  Calendar,
  Filter
} from "lucide-react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Reports() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentDivision, getEffectiveColors } = useBrand();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("overview");
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("company"); // "company" for company-wide

  const colors = getEffectiveColors();

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

  // Get divisions for selection
  const { data: divisions } = useQuery({
    queryKey: ["/api/divisions"],
    enabled: !!user,
    retry: false,
  });

  // Determine which division ID to use for API calls
  const reportDivisionId = selectedDivisionId === "company" ? undefined : parseInt(selectedDivisionId);
  const isCompanyWide = selectedDivisionId === "company";

  // Get stats based on selected division
  const { data: contactStats, isLoading: statsLoading } = useQuery({
    queryKey: isCompanyWide ? ["/api/company-stats"] : ["/api/contacts/stats", { divisionId: reportDivisionId }],
    enabled: !!user,
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/contact-categories", { divisionId: reportDivisionId }],
    enabled: !!user,
    retry: false,
  });

  const { data: uploads } = useQuery({
    queryKey: ["/api/uploads", { divisionId: reportDivisionId }],
    enabled: !!user,
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

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Export Started",
      description: `Your ${format.toUpperCase()} report is being generated...`,
    });
    // TODO: Implement actual export functionality
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
  };

  // Mock data for demonstration
  const growthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Contacts',
      data: [150, 230, 180, 290, 240, 320],
      borderColor: colors.primaryColor,
      backgroundColor: colors.primaryColor + '20',
      fill: true,
      tension: 0.4,
    }],
  };

  const categoryData = {
    labels: categories?.map((c: any) => c.name) || ['Customers', 'Prospects', 'Partners'],
    datasets: [{
      data: contactStats?.byCategory?.map((c: any) => c.count) || [4523, 3124, 2156],
      backgroundColor: categories?.map((c: any) => c.color) || [colors.primaryColor, colors.accentColor, '#4CAF50'],
      borderWidth: 0,
    }],
  };

  const sourceData = {
    labels: ['Manual Entry', 'CSV Import', 'Excel Import', 'API'],
    datasets: [{
      label: 'Contacts by Source',
      data: [450, 1200, 800, 350],
      backgroundColor: [colors.primaryColor, colors.accentColor, '#4CAF50', '#9C27B0'],
    }],
  };

  const exportActions = (
    <div className="flex items-center space-x-2">
      {/* Division Selector */}
      <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select division" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="company">Company-wide Reports</SelectItem>
          {divisions && Array.isArray(divisions) && divisions.map((division: any) => (
            <SelectItem key={division.id} value={division.id.toString()}>
              {division.name} Division
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">7 Days</SelectItem>
          <SelectItem value="30days">30 Days</SelectItem>
          <SelectItem value="90days">90 Days</SelectItem>
          <SelectItem value="1year">1 Year</SelectItem>
        </SelectContent>
      </Select>
      
      <Button variant="outline" onClick={() => handleExportReport('pdf')}>
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      
      <Button variant="outline" onClick={() => handleExportReport('excel')}>
        <Download className="w-4 h-4 mr-2" />
        Export Excel
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title={isCompanyWide ? "Company-wide Reports & Analytics" : `${divisions?.find((d: any) => d.id.toString() === selectedDivisionId)?.name || 'Division'} Reports & Analytics`}
          description={isCompanyWide ? "Comprehensive insights across all divisions and company data." : `Detailed insights for the ${divisions?.find((d: any) => d.id.toString() === selectedDivisionId)?.name || 'selected'} division.`}
          actions={exportActions}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Scope Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-white bg-primary/80">
                    {isCompanyWide ? "Company-wide View" : `${divisions?.find((d: any) => d.id.toString() === selectedDivisionId)?.name || 'Division'} View`}
                  </Badge>
                  {isCompanyWide && (
                    <span className="text-sm text-muted-foreground">
                      Showing data across {contactStats?.totalDivisions || 0} divisions
                    </span>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                        <p className="text-3xl font-bold text-foreground">
                          {(() => {
                            const value = isCompanyWide ? contactStats?.totalContacts : contactStats?.total;
                            return value ? value.toLocaleString() : '0';
                          })()}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">With Email</p>
                        <p className="text-3xl font-bold text-foreground">
                          {(() => {
                            const value = isCompanyWide ? contactStats?.totalWithEmail : contactStats?.withEmail;
                            return value ? value.toLocaleString() : '0';
                          })()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            if (!contactStats) return '0';
                            const emailCount = isCompanyWide ? contactStats.totalWithEmail : contactStats.withEmail;
                            const totalCount = isCompanyWide ? contactStats.totalContacts : contactStats.total;
                            return emailCount && totalCount ? Math.round((emailCount / totalCount) * 100) : 0;
                          })()}% coverage
                        </p>
                      </div>
                      <Mail className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">With Phone</p>
                        <p className="text-3xl font-bold text-foreground">
                          {(() => {
                            const value = isCompanyWide ? contactStats?.totalWithPhone : contactStats?.withPhone;
                            return value ? value.toLocaleString() : '0';
                          })()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            if (!contactStats) return '0';
                            const phoneCount = isCompanyWide ? contactStats.totalWithPhone : contactStats.withPhone;
                            const totalCount = isCompanyWide ? contactStats.totalContacts : contactStats.total;
                            return phoneCount && totalCount ? Math.round((phoneCount / totalCount) * 100) : 0;
                          })()}% coverage
                        </p>
                      </div>
                      <Phone className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                        <p className="text-3xl font-bold text-foreground">
                          {(() => {
                            if (!contactStats) return '0%';
                            const emailCount = isCompanyWide ? contactStats.totalWithEmail : contactStats.withEmail;
                            const phoneCount = isCompanyWide ? contactStats.totalWithPhone : contactStats.withPhone;
                            const totalCount = isCompanyWide ? contactStats.totalContacts : contactStats.total;
                            if (!emailCount || !phoneCount || !totalCount) return '0%';
                            return Math.round(((emailCount + phoneCount) / (totalCount * 2)) * 100) + '%';
                          })()}
                        </p>
                        <p className="text-sm text-muted-foreground">Contact completeness</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Categories</CardTitle>
                    <CardDescription>Distribution by category type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Pie data={categoryData} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Sources</CardTitle>
                    <CardDescription>How contacts were added</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Bar data={sourceData} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Growth Trends</CardTitle>
                  <CardDescription>Track database growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <Line data={growthData} options={{
                      ...chartOptions,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }} />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold">+320</p>
                        <p className="text-sm text-green-600">+12.5% from last month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">This Week</p>
                        <p className="text-2xl font-bold">+86</p>
                        <p className="text-sm text-blue-600">+8.2% from last week</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg. Daily</p>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-sm text-purple-600">New contacts per day</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Import History</CardTitle>
                  <CardDescription>Recent file uploads and imports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uploads?.slice(0, 10).map((upload: any) => (
                      <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{upload.originalName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(upload.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                            {upload.status}
                          </Badge>
                          {upload.recordsImported && (
                            <span className="text-sm font-medium">
                              {upload.recordsImported.toLocaleString()} contacts
                            </span>
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No imports found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest changes and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">320 new contacts imported</p>
                        <p className="text-xs text-muted-foreground">From customer_data_Q4.xlsx</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">2 hours ago</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">New category "Prospects" created</p>
                        <p className="text-xs text-muted-foreground">By Admin User</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">1 day ago</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Report exported</p>
                        <p className="text-xs text-muted-foreground">Monthly summary (PDF)</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">2 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
