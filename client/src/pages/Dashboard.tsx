import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = {
  "NoPrazo": "#3b82f6",
  "SLAVencida": "#ef4444",
  "Critico": "#dc2626",
  "Resolvido": "#10b981",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [avgTime, setAvgTime] = useState<number>(0);

  const { data: reportsList, isLoading: reportsLoading } = trpc.reports.list.useQuery({
    limit: 1000,
  });

  const { data: statsData } = trpc.reports.stats.useQuery();
  const { data: avgResolutionTime } = trpc.reports.avgResolutionTime.useQuery();

  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
    if (avgResolutionTime !== undefined) {
      setAvgTime(avgResolutionTime);
    }
  }, [statsData, avgResolutionTime]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Você precisa estar autenticado para acessar o dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const statusData = stats
    ? Object.entries(stats.byStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  const agentData = stats
    ? Object.entries(stats.byAgent).map(([agent, count]) => ({
        name: agent,
        value: count,
      }))
    : [];

  const reasonData = stats
    ? Object.entries(stats.byReason).map(([reason, count]) => ({
        name: reason,
        value: count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard de Erros N0</h1>
          <p className="text-gray-600">Acompanhamento em tempo real de reports de erro</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reports</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-gray-500">Reports registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.byStatus?.Critico || 0}</div>
              <p className="text-xs text-gray-500">Requerem atenção imediata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Vencida</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.byStatus?.SLAVencida || 0}</div>
              <p className="text-xs text-gray-500">Fora do prazo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.byStatus?.Resolvido || 0}</div>
              <p className="text-xs text-gray-500">Tempo médio: {avgTime}h</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
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

          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Reports por Agente</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Reason Distribution */}
        <Card className="mb-8">
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

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Reports Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsLoading ? (
                <p className="text-gray-500">Carregando...</p>
              ) : reportsList && reportsList.length > 0 ? (
                reportsList.slice(0, 5).map((report: any) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{report.clientId}</p>
                      <p className="text-sm text-gray-500">{report.reason}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        report.status === "Critico" ? "bg-red-100 text-red-800" :
                        report.status === "SLAVencida" ? "bg-orange-100 text-orange-800" :
                        report.status === "Resolvido" ? "bg-green-100 text-green-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {report.status}
                      </span>
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nenhum report encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
