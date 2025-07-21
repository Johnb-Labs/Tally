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
