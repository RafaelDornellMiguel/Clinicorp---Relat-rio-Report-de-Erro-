import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Filter, ChevronRight } from "lucide-react";
import { ReportModal } from "@/components/ReportModal";
import { CreateReportModal } from "@/components/CreateReportModal";
import { DuplicateAlert } from "@/components/DuplicateAlert";
import type { ErrorReport } from "@shared/types";

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState<Set<string>>(new Set());
  
  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch reports with filters
  const { data: reports, isLoading, refetch } = trpc.reports.list.useQuery({
    search: search || undefined,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    reason: reasonFilter && reasonFilter !== "all" ? reasonFilter : undefined,
    origin: originFilter && originFilter !== "all" ? originFilter : undefined,
    assignedAgent: agentFilter && agentFilter !== "all" ? agentFilter : undefined,
    priority: priorityFilter && priorityFilter !== "all" ? priorityFilter : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: 100,
  });

  // Detectar duplicatas
  const duplicateAlerts = useMemo(() => {
    if (!reports) return new Map();
    const clientCounts = new Map<string, number>();
    reports.forEach((report: any) => {
      clientCounts.set(report.clientId, (clientCounts.get(report.clientId) || 0) + 1);
    });
    return clientCounts;
  }, [reports]);

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

  const handleReportClick = (report: ErrorReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleCreateReport = () => {
    setShowCreateModal(true);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setReasonFilter("all");
    setOriginFilter("all");
    setAgentFilter("all");
    setPriorityFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const activeFilters = [search, statusFilter, reasonFilter, originFilter, agentFilter, priorityFilter, startDate, endDate].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports de Erro</h1>
            <p className="text-gray-600">Gerenciar e acompanhar todos os reports de erro</p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={handleCreateReport} className="gap-2 bg-primary hover:bg-primary-dark">
              <Plus className="h-4 w-4" />
              Novo Report
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros ({activeFilters})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID do cliente, chave ou ticket..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!showFilters && "hidden"}`}>
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="NoPrazo">No prazo</SelectItem>
                    <SelectItem value="SLAVencida">SLA Vencida</SelectItem>
                    <SelectItem value="Critico">Crítico</SelectItem>
                    <SelectItem value="Resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>

                {/* Reason Filter */}
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Motivos</SelectItem>
                    <SelectItem value="ClientBase">Cliente (Base)</SelectItem>
                    <SelectItem value="Modelador">Modelador</SelectItem>
                    <SelectItem value="Analista">Analista</SelectItem>
                    <SelectItem value="Engenharia">Engenharia</SelectItem>
                    <SelectItem value="EmAnalise">Em análise</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>

                {/* Origin Filter */}
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Origens</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                    <SelectItem value="Other">Outro</SelectItem>
                  </SelectContent>
                </Select>

                {/* Agent Filter */}
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Agentes</SelectItem>
                    <SelectItem value="Sarah">Sarah</SelectItem>
                    <SelectItem value="Pamela">Pamela</SelectItem>
                    <SelectItem value="Rafael">Rafael</SelectItem>
                    <SelectItem value="Luan">Luan</SelectItem>
                    <SelectItem value="Jéssica">Jéssica</SelectItem>
                    <SelectItem value="Samuel">Samuel</SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="Low">Baixa</SelectItem>
                    <SelectItem value="Medium">Média</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                    <SelectItem value="Critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>

                {/* Start Date Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Início</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Término</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Toggle Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 w-full"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ocultar Filtros Avançados" : "Mostrar Filtros Avançados"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {reports?.length || 0} Reports
              {activeFilters > 0 && ` (${activeFilters} filtro${activeFilters > 1 ? "s" : ""} ativo${activeFilters > 1 ? "s" : ""})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando reports...</p>
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((report: any) => {
                  const duplicateCount = duplicateAlerts.get(report.clientId) || 0;
                  const isDuplicate = duplicateCount >= 2 && !dismissedDuplicates.has(report.clientId);

                  return (
                    <div key={report.id}>
                      {isDuplicate && (
                        <DuplicateAlert
                          clientId={report.clientId}
                          count={duplicateCount}
                          onClose={() => {
                            const newDismissed = new Set(dismissedDuplicates);
                            newDismissed.add(report.clientId);
                            setDismissedDuplicates(newDismissed);
                          }}
                        />
                      )}
                      <div
                        onClick={() => handleReportClick(report)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-gray-900 truncate">{report.clientId}</p>
                              <p className="text-sm text-gray-500">Chave: {report.key}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {report.reason}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {report.origin}
                            </span>
                            {report.assignedAgent && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {report.assignedAgent}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              report.status === "Critico" ? "bg-red-100 text-red-800" :
                              report.status === "SLAVencida" ? "bg-orange-100 text-orange-800" :
                              report.status === "Resolvido" ? "bg-green-100 text-green-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {report.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum report encontrado com os filtros selecionados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ReportModal
        report={selectedReport}
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedReport(null);
        }}
      />

      <CreateReportModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
