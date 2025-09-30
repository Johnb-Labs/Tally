import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
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

  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log("Export report clicked");
  };

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Division Selector */}
          {showDivisionSelector && (
            <Select
              value={currentDivision?.id.toString() || ""}
              onValueChange={handleDivisionChange}
            >
              <SelectTrigger className="w-full sm:w-48" data-testid="select-division">
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
            <Button onClick={handleExportReport} className="w-full sm:w-auto" data-testid="button-export-report">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
