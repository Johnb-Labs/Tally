import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useBrand } from "@/contexts/BrandContext";
import type { ContactCategory } from "@shared/schema";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ContactTypesChartProps {
  categories?: ContactCategory[];
}

export default function ContactTypesChart({ categories }: ContactTypesChartProps) {
  const { getEffectiveColors } = useBrand();
  const colors = getEffectiveColors();

  // Default colors for categories
  const defaultColors = [
    colors.primaryColor,
    colors.accentColor,
    "#4CAF50",
    "#9C27B0",
    "#757575",
    "#FF5722",
    "#607D8B",
    "#795548",
  ];

  // Mock data if no categories provided
  const mockData = [
    { name: "Customers", count: 4523, color: colors.primaryColor },
    { name: "Prospects", count: 3124, color: colors.accentColor },
    { name: "Partners", count: 2156, color: "#4CAF50" },
    { name: "Vendors", count: 1892, color: "#9C27B0" },
    { name: "Inactive", count: 1152, color: "#757575" },
  ];

  const chartData = categories?.length ? {
    labels: categories.map(c => c.name),
    datasets: [{
      data: categories.map(() => Math.floor(Math.random() * 5000) + 1000), // Mock counts
      backgroundColor: categories.map((c, i) => c.color || defaultColors[i % defaultColors.length]),
      borderWidth: 0,
      cutout: "60%",
    }]
  } : {
    labels: mockData.map(d => d.name),
    datasets: [{
      data: mockData.map(d => d.count),
      backgroundColor: mockData.map(d => d.color),
      borderWidth: 0,
      cutout: "60%",
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: colors.primaryColor,
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contact Types</CardTitle>
          <CardDescription>Distribution of contacts by category</CardDescription>
        </div>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Doughnut options={chartOptions} data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
}
