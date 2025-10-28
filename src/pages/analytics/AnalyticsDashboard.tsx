import { useEffect, useRef, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import * as d3 from 'd3';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mock data - replace with your actual data source
const engagementData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Active Users',
      data: [65, 59, 80, 81, 56, 55],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.3,
    },
    {
      label: 'Page Views',
      data: [28, 48, 40, 19, 86, 27],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.2)',
      tension: 0.3,
    },
  ],
};

const categoryData = {
  labels: ['Technology', 'Science', 'Business', 'Health', 'Entertainment'],
  datasets: [
    {
      label: 'Engagement by Category',
      data: [12, 19, 3, 5, 2],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const AnalyticsDashboard = () => {
  const d3Container = useRef<HTMLDivElement>(null);
  const [offlineStatus, setOfflineStatus] = useState(navigator.onLine);

  // Set up D3.js visualization
  useEffect(() => {
    if (!d3Container.current) return;

    // Clear previous content
    d3.select(d3Container.current).selectAll('*').remove();

    // Sample data for D3 visualization
    const data = [12, 31, 22, 17, 25, 18, 29, 14, 9];

    // Set up SVG
    const width = d3Container.current.clientWidth;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const svg = d3
      .select(d3Container.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    // Create scales
    const x = d3
      .scaleBand()
      .domain(data.map((_, i) => `Week ${i + 1}`))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data) || 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add bars
    svg
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (_, i) => x(`Week ${i + 1}`) || 0)
      .attr('y', (d) => y(d))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(0) - y(d))
      .attr('fill', 'rgba(53, 162, 235, 0.5)');
  }, []);

  // Set up offline/online detection
  useEffect(() => {
    const handleOnline = () => setOfflineStatus(true);
    const handleOffline = () => setOfflineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to handle data export
  const handleExport = () => {
    // In a real app, you would implement data export logic here
    console.log('Exporting data...');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {!offlineStatus && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>You are currently offline. Some data may not be up to date.</p>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="d3">D3 Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,345</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4m 23s</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.4%</div>
                <p className="text-xs text-muted-foreground">-0.8% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <Line
                data={engagementData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: 'User Engagement Metrics',
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Pie
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Bar
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="d3">
          <Card>
            <CardHeader>
              <CardTitle>D3.js Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={d3Container} className="w-full h-[400px]" />
              <p className="text-sm text-muted-foreground mt-2">
                This is a sample D3.js visualization showing weekly data. The chart is fully responsive and interactive.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
