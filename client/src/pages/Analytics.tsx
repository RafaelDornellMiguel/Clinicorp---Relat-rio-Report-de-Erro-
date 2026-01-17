import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

const COLORS = {
  "NoPrazo": "#3b82f6",
  "SLAVencida": "#ef4444",
  "Critico": "#dc2626",
  "Resolvido": "#10b981",
};

export default function Analytics() {
  const { isAuthenticated } = useAuth();

  const { data: reportsList } = trpc.reports.list.useQuery({
    limit: 1000,
  });

  const { data: stats } = trpc.reports.stats.useQuery();
  const { data: avgResolutionTime } = trpc.reports.avgResolutionTime.useQuery();

  // Calculate trends over time
  const timelineData = useMemo(() => {
    if (!reportsList) return [];

    const grouped: { [key: string]: number } = {};

    reportsList.forEach((report: any) => {
      const date = new Date(report.createdAt).toLocaleDateString("pt-BR");
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({
        date,
        reports: count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reportsList]);

  // Calculate resolution rate
  const resolutionRate = useMemo(() => {
    if (!stats) return 0;
    const total = stats.total || 1;
    const resolved = stats.byStatus?.Resolvido || 0;
    return Math.round((resolved / total) * 100);
  }, [stats]);

  // Calculate critical percentage
  const criticalPercentage = useMemo(() => {
    if (!stats) return 0;
    const total = stats.total || 1;
    const critical = stats.byStatus?.Critico || 0;
    return Math.round((critical / total) * 100);
  }, [stats]);

  // Calculate SLA compliance
  const slaCompliance = useMemo(() => {
    if (!stats) return 0;
    const total = stats.total || 1;
    const noPrazo = stats.byStatus?.NoPrazo || 0;
    const resolvido = stats.byStatus?.Resolvido || 0;
    return Math.round(((noPrazo + resolvido) / total) * 100);
  }, [stats]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Você precisa estar autenticado para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusData = stats
    ? Object.entries(stats.byStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  const reasonData = stats
    ? Object.entries(stats.byReason).map(([reason, count]) => ({
        name: reason,
        value: count,
      }))
    : [];

  const priorityData = stats
    ? Object.entries(stats.byPriority).map(([priority, count]) => ({
        name: priority,
        value: count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Análise detalhada de tendências e performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolutionRate}%</div>
              <p className="text-xs text-gray-500">Reports resolvidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conformidade SLA</CardTitle>
              <ArrowUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{slaCompliance}%</div>
              <p className="text-xs text-gray-500">No prazo + Resolvido</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <ArrowDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalPercentage}%</div>
              <p className="text-xs text-gray-500">Do total de reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResolutionTime || 0}h</div>
              <p className="text-xs text-gray-500">Para resolução</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tendência de Reports ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorReports)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry: any) => (
                      <Cell key={`cell-${entry.name}`} fill={(COLORS as any)[entry.name] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Reason Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Motivo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reasonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
