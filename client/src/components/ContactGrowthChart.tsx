import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useBrand } from "@/contexts/BrandContext";
import { useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ContactGrowthChart() {
  const { getEffectiveColors } = useBrand();
  const [period, setPeriod] = useState("6months");

  const colors = getEffectiveColors();

  // Mock data - in a real app, this would come from an API
  const mockData = {
    "6months": {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      data: [8500, 9200, 10100, 10800, 11600, 12847],
    },
    "1year": {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      data: [6000, 6500, 7200, 7800, 8500, 9200, 10100, 10800, 11600, 12200, 12600, 12847],
    },
    "alltime": {
      labels: ["2022", "2023", "2024"],
      data: [3000, 8000, 12847],
    },
  };

  const currentData = mockData[period as keyof typeof mockData];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: colors.primaryColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        border: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const chartData = {
    labels: currentData.labels,
    datasets: [
      {
        label: "Total Contacts",
        data: currentData.data,
        borderColor: colors.primaryColor,
        backgroundColor: colors.primaryColor + '20', // Add transparency
        borderWidth: 3,
        fill: true,
        pointBackgroundColor: colors.primaryColor,
        pointBorderColor: colors.primaryColor,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contact Growth</CardTitle>
          <CardDescription>Track your contact database growth over time</CardDescription>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">6 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
            <SelectItem value="alltime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line options={chartOptions} data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
}
