import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Building2,
  FileText,
  Upload,
  Activity,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CompanyStats {
  totalContacts: number;
  totalDivisions: number;
  totalActiveUsers: number;
  totalUploads: number;
  totalEmails: number;
  totalPhones: number;
  totalAddresses: number;
  divisionStats: {
    divisionId: number;
    divisionName: string;
    contactCount: number;
    activeUsers: number;
    recentUploads: number;
    emailCount: number;
    phoneCount: number;
    addressCount: number;
    description?: string;
  }[];
}

export default function CompanyDashboard() {
  const { data: companyStats, isLoading, error } = useQuery<CompanyStats>({
    queryKey: ["/api/company-stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Company Dashboard</CardTitle>
            <CardDescription>
              Failed to load company statistics. Please check your permissions or try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!companyStats) {
    return null;
  }

  // Prepare chart data
  const chartData = {
    labels: companyStats.divisionStats.map(d => d.divisionName),
    datasets: [
      {
        label: "Contacts",
        data: companyStats.divisionStats.map(d => d.contactCount),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Active Users",
        data: companyStats.divisionStats.map(d => d.activeUsers),
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Division Overview",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const maxContacts = Math.max(...companyStats.divisionStats.map(d => d.contactCount));

  // Create stats data in the same format as regular dashboard
  const companyStatsData = [
    {
      label: "Total Contacts",
      value: companyStats.totalContacts.toLocaleString(),
      change: "+Company Wide",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Total Email Addresses",
      value: (companyStats.totalEmails || 0).toLocaleString(),
      change: "Active",
      icon: Mail,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Total Phone Numbers",
      value: (companyStats.totalPhones || 0).toLocaleString(),
      change: "Active",
      icon: Phone,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Physical Addresses",
      value: (companyStats.totalAddresses || 0).toLocaleString(),
      change: "Complete",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards - Same styling as regular dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {companyStatsData.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Company
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Same layout as regular dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Division Performance</CardTitle>
            <CardDescription>
              Contact counts and active users by division
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Company Overview</CardTitle>
              <CardDescription>Quick statistics across all divisions</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[#ffffff]">Executive</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total Database</p>
                  <p className="text-xs text-muted-foreground">All contact records</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{companyStats.totalContacts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">contacts</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active Divisions</p>
                  <p className="text-xs text-muted-foreground">Operating units</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{companyStats.totalDivisions}</p>
                <p className="text-xs text-muted-foreground">divisions</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">System Users</p>
                  <p className="text-xs text-muted-foreground">Active accounts</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{companyStats.totalActiveUsers}</p>
                <p className="text-xs text-muted-foreground">users</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active Divisions</p>
                  <p className="text-xs text-muted-foreground">Operating units</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{companyStats.totalDivisions}</p>
                <p className="text-xs text-muted-foreground">divisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Division Details - Same styling as regular dashboard tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Division Breakdown</CardTitle>
              <CardDescription>Contact distribution by division</CardDescription>
            </div>
            
          </CardHeader>
          <CardContent className="space-y-4">
            {companyStats.divisionStats.length > 0 ? (
              companyStats.divisionStats.map((division) => {
                const percentage = companyStats.totalContacts > 0 ? 
                  Math.round((division.contactCount / companyStats.totalContacts) * 100) : 0;
                
                return (
                  <div key={division.divisionId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">{division.divisionName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground">
                        {division.contactCount.toLocaleString()}
                      </span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No divisions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Division Summary</CardTitle>
              <CardDescription>Detailed information for all divisions</CardDescription>
            </div>
            
          </CardHeader>
          <CardContent className="space-y-4">
            {companyStats.divisionStats.map((division) => (
              <div key={division.divisionId} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{division.divisionName}</p>
                      <p className="text-xs text-muted-foreground">
                        {division.description || "No description available"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[#ffffff]">
                    {division.contactCount.toLocaleString()} contacts
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-orange-600">{division.emailCount || 0}</p>
                    <p className="text-muted-foreground">Emails</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{division.phoneCount || 0}</p>
                    <p className="text-muted-foreground">Phones</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">{division.addressCount || 0}</p>
                    <p className="text-muted-foreground">Addresses</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-purple-600">{division.activeUsers}</p>
                    <p className="text-muted-foreground">Users</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}