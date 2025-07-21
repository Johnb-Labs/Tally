import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface TopHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function TopHeader({ title, description, actions }: TopHeaderProps) {
  const { user } = useAuth();
  const { currentDivision, setCurrentDivision } = useBrand();

  const userDivisions = (user as any)?.divisions || [];
  const showDivisionSelector = userDivisions.length > 1;

  const handleDivisionChange = (divisionId: string) => {
    const division = userDivisions.find((d: any) => d.id === parseInt(divisionId));
    setCurrentDivision(division || null);
  };

  // Fetch contact stats for export
  const { data: contactStats } = useQuery({
    queryKey: ["/api/contacts/stats", currentDivision?.id],
    enabled: !!user,
  });

  const handleExportReport = () => {
    if (!contactStats || !currentDivision) {
      // Generate general report if no division is selected
      const reportData = [
        ['Contact Management Report'],
        ['Generated:', new Date().toLocaleDateString()],
        [''],
        ['General Information'],
        ['User:', user?.firstName || 'Unknown'],
        ['Export Date:', new Date().toISOString().split('T')[0]],
        [''],
        ['Note: Select a division to view detailed contact statistics']
      ];

      const csv = reportData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `general-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      return;
    }

    const stats = contactStats as any;
    const reportData = [
      ['Division Contact Report'],
      ['Division:', currentDivision.name],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Contact Summary'],
      ['Total Contacts:', stats.total.toLocaleString()],
      ['Email Addresses:', `${stats.withEmail.toLocaleString()} (${Math.round((stats.withEmail / stats.total) * 100)}%)`],
      ['Phone Numbers:', `${stats.withPhone.toLocaleString()} (${Math.round((stats.withPhone / stats.total) * 100)}%)`],
      ['Physical Addresses:', `${(stats.withAddress || 0).toLocaleString()} (${Math.round(((stats.withAddress || 0) / stats.total) * 100)}%)`],
      ['Company Information:', `${(stats.withCompany || 0).toLocaleString()} (${Math.round(((stats.withCompany || 0) / stats.total) * 100)}%)`],
      [''],
      ['Category Breakdown'],
      ...((stats.byCategory || []).map((cat: any) => [cat.categoryName || 'Uncategorized', cat.count.toLocaleString()]))
    ];

    const csv = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDivision.name}-contact-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Division Selector */}
          {showDivisionSelector && (
            <Select
              value={currentDivision?.id.toString() || ""}
              onValueChange={handleDivisionChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Division" />
              </SelectTrigger>
              <SelectContent>
                {userDivisions.map((division: any) => (
                  <SelectItem key={division.id} value={division.id.toString()}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Custom Actions */}
          {actions}

          {/* Default Export Button */}
          {!actions && (
            <Button onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
