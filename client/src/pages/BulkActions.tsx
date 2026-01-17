import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BulkActions() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [actionType, setActionType] = useState<"status" | "delete">("status");

  // Fetch all reports
  const { data: reports } = trpc.reports.list.useQuery({
    limit: 1000,
  });

  // Mutations
  const updateMutation = trpc.reports.update.useMutation({
    onSuccess: () => {
      toast.success(`${selectedReports.length} reports atualizados com sucesso!`);
      setSelectedReports([]);
      setNewStatus("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar reports");
    },
  });

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => {
      toast.success(`${selectedReports.length} reports deletados com sucesso!`);
      setSelectedReports([]);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar reports");
    },
  });

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

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Apenas administradores podem realizar ações em massa.</p>
            <Button onClick={() => setLocation("/reports")} className="mt-4 w-full">
              Voltar para Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectAll = () => {
    if (selectedReports.length === reports?.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports?.map((r: any) => r.id) || []);
    }
  };

  const handleSelectReport = (reportId: number) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter((id) => id !== reportId));
    } else {
      setSelectedReports([...selectedReports, reportId]);
    }
  };

  const handleExecuteAction = async () => {
    if (selectedReports.length === 0) {
      toast.error("Selecione pelo menos um report");
      return;
    }

    if (actionType === "status") {
      if (!newStatus) {
        toast.error("Selecione um novo status");
        return;
      }

      try {
        for (const reportId of selectedReports) {
          await updateMutation.mutateAsync({
            id: reportId,
            status: newStatus,
          });
        }
      } catch (error) {
        console.error("Error updating:", error);
      }
    } else if (actionType === "delete") {
      if (!window.confirm(`Tem certeza que deseja deletar ${selectedReports.length} reports?`)) {
        return;
      }

      try {
        for (const reportId of selectedReports) {
          await deleteMutation.mutateAsync(reportId);
        }
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => setLocation("/reports")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ações em Massa</h1>
            <p className="text-gray-600">Atualizar ou deletar múltiplos reports de uma vez</p>
          </div>
        </div>

        {/* Action Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configurar Ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de Ação</label>
              <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Atualizar Status</SelectItem>
                  <SelectItem value="delete">Deletar Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType === "status" && (
              <div>
                <label className="text-sm font-medium text-gray-700">Novo Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NoPrazo">No prazo</SelectItem>
                    <SelectItem value="SLAVencida">SLA Vencida</SelectItem>
                    <SelectItem value="Critico">Crítico</SelectItem>
                    <SelectItem value="Resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              <p className="font-medium">
                {selectedReports.length} report{selectedReports.length !== 1 ? "s" : ""} selecionado
                {selectedReports.length !== 1 ? "s" : ""}
              </p>
            </div>

            <Button
              onClick={handleExecuteAction}
              disabled={selectedReports.length === 0 || updateMutation.isPending || deleteMutation.isPending}
              className={`w-full gap-2 ${actionType === "delete" ? "bg-red-600 hover:bg-red-700" : ""}`}
            >
              {actionType === "status" ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Status
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Deletar Reports
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Selecione Reports</CardTitle>
              <Checkbox
                checked={selectedReports.length === reports?.length && reports?.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => handleSelectReport(report.id)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{report.clientId}</p>
                      <p className="text-sm text-gray-500">Chave: {report.key}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        report.status === "Critico"
                          ? "bg-red-100 text-red-800"
                          : report.status === "SLAVencida"
                          ? "bg-orange-100 text-orange-800"
                          : report.status === "Resolvido"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum report encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
