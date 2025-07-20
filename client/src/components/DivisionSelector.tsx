import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Division {
  id: number;
  name: string;
  description?: string;
}

interface DivisionSelectorProps {
  value?: number | "all";
  onValueChange: (value: number | "all") => void;
  showAllOption?: boolean;
}

export function DivisionSelector({ 
  value, 
  onValueChange, 
  showAllOption = false 
}: DivisionSelectorProps) {
  const { user } = useAuth();
  
  const { data: divisions, isLoading } = useQuery<Division[]>({
    queryKey: ["/api/divisions"],
    enabled: !!user,
  });

  // Check if user can see all divisions (admin/exco)
  const canSeeAllDivisions = (user as any)?.role === 'admin' || (user as any)?.role === 'exco';
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading divisions...</span>
      </div>
    );
  }

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "all") {
      onValueChange("all");
    } else {
      onValueChange(parseInt(selectedValue));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4" />
      <Select value={value?.toString()} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select division" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && canSeeAllDivisions && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>All Divisions</span>
                <Badge variant="secondary" className="text-xs">
                  Company View
                </Badge>
              </div>
            </SelectItem>
          )}
          {divisions?.map((division) => (
            <SelectItem key={division.id} value={division.id.toString()}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{division.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value === "all" && (
        <Badge variant="outline" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          Company Overview
        </Badge>
      )}
    </div>
  );
}