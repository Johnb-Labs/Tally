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
  divisionStats: {
    divisionId: number;
    divisionName: string;
    contactCount: number;
    activeUsers: number;
    recentUploads: number;
  }[];
}

export default function CompanyDashboard() {
  const { data: companyStats, isLoading, error } = useQuery<CompanyStats>({
    queryKey: ["/api/company-stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all divisions and company-wide statistics
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Executive View
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all divisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Divisions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalDivisions}</div>
            <p className="text-xs text-muted-foreground">
              Operating divisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              System users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalUploads}</div>
            <p className="text-xs text-muted-foreground">
              Data imports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Division Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Division Performance</CardTitle>
          <CardDescription>
            Contact counts and active users by division
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Division Details */}
      <Card>
        <CardHeader>
          <CardTitle>Division Details</CardTitle>
          <CardDescription>
            Detailed breakdown of each division's metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyStats.divisionStats.map((division) => (
              <div
                key={division.divisionId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{division.divisionName}</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contacts:</span>
                      <span className="ml-2 font-medium">{division.contactCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Users:</span>
                      <span className="ml-2 font-medium">{division.activeUsers}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recent Uploads:</span>
                      <span className="ml-2 font-medium">{division.recentUploads}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-32">
                  <div className="text-xs text-muted-foreground mb-1">
                    Contacts vs Max
                  </div>
                  <Progress 
                    value={maxContacts > 0 ? (division.contactCount / maxContacts) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}