import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export default function StatsCard({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  color, 
  bgColor 
}: StatsCardProps) {
  const isPositive = change.startsWith('+');
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            <div className="flex items-center mt-2">
              <span 
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change}
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last month</span>
            </div>
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
