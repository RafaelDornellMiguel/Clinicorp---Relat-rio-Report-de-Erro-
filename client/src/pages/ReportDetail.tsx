import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Save, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { ExportReportDialog } from "@/components/ExportReportDialog";

export default function ReportDetail() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/reports/:id");
  const reportId = params?.id ? parseInt(params.id) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Fetch report details
  const { data: report, isLoading } = trpc.reports.getById.useQuery(reportId || 0, {
    enabled: !!reportId && match,
  });

  // Mutations
  const updateMutation = trpc.reports.update.useMutation({
    onSuccess: () => {
      toast.success("Report atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar report");
    },
  });

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => {
      toast.success("Report deletado com sucesso!");
      setLocation("/reports");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar report");
    },
  });

  const commentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      setFormData({ ...formData, newComment: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar comentário");
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

  if (!reportId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Report não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">O report solicitado não existe.</p>
            <Button onClick={() => setLocation("/reports")} className="mt-4 w-full">
              Voltar para Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Report não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Não foi possível carregar o report.</p>
            <Button onClick={() => setLocation("/reports")} className="mt-4 w-full">
              Voltar para Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = user?.role === "admin" || report.assignedAgent === user?.name;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: report.id,
        ...formData,
      });
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja deletar este report?")) {
      try {
        await deleteMutation.mutateAsync(report.id);
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleAddComment = async () => {
    if (!formData.newComment?.trim()) return;

    try {
      await commentMutation.mutateAsync({
        reportId: report.id,
        comment: formData.newComment,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/reports")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{report.clientId}</h1>
            <p className="text-gray-600">Chave: {report.key}</p>
          </div>
        </div>

        {/* Main Info Card */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informações do Report</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                {isEditing ? (
                  <Select
                    value={formData.status || report.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NoPrazo">No prazo</SelectItem>
                      <SelectItem value="SLAVencida">SLA Vencida</SelectItem>
                      <SelectItem value="Critico">Crítico</SelectItem>
                      <SelectItem value="Resolvido">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className={`mt-1 px-3 py-2 rounded-full inline-block text-sm font-medium ${
                    report.status === "Critico" ? "bg-red-100 text-red-800" :
                    report.status === "SLAVencida" ? "bg-orange-100 text-orange-800" :
                    report.status === "Resolvido" ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {report.status}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium text-gray-700">Prioridade</label>
                {isEditing ? (
                  <Select
                    value={formData.priority || report.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Baixa</SelectItem>
                      <SelectItem value="Medium">Média</SelectItem>
                      <SelectItem value="High">Alta</SelectItem>
                      <SelectItem value="Critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-gray-900">{report.priority}</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-gray-700">Motivo</label>
                {isEditing ? (
                  <Select
                    value={formData.reason || report.reason}
                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ClientBase">Cliente (Base)</SelectItem>
                      <SelectItem value="Modelador">Modelador</SelectItem>
                      <SelectItem value="Analista">Analista</SelectItem>
                      <SelectItem value="Engenharia">Engenharia</SelectItem>
                      <SelectItem value="EmAnalise">Em análise</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-gray-900">{report.reason}</p>
                )}
              </div>

              {/* Origin */}
              <div>
                <label className="text-sm font-medium text-gray-700">Origem</label>
                {isEditing ? (
                  <Select
                    value={formData.origin || report.origin}
                    onValueChange={(value) => setFormData({ ...formData, origin: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-gray-900">{report.origin}</p>
                )}
              </div>

              {/* Assigned Agent */}
              <div>
                <label className="text-sm font-medium text-gray-700">Agente Responsável</label>
                {isEditing ? (
                  <Input
                    value={formData.assignedAgent || report.assignedAgent || ""}
                    onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{report.assignedAgent || "-"}</p>
                )}
              </div>

              {/* Ticket URL */}
              <div>
                <label className="text-sm font-medium text-gray-700">URL do Ticket</label>
                {isEditing ? (
                  <Input
                    value={formData.ticketUrl || report.ticketUrl || ""}
                    onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">
                    {report.ticketUrl ? (
                      <a href={report.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {report.ticketUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Modules */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Módulos Importados</label>
              {isEditing ? (
                <Textarea
                  value={formData.modules || report.modules || ""}
                  onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{report.modules || "-"}</p>
              )}
            </div>

            {/* Records */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Registros Afetados</label>
              {isEditing ? (
                <Textarea
                  value={formData.records || report.records || ""}
                  onChange={(e) => setFormData({ ...formData, records: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{report.records || "-"}</p>
              )}
            </div>

            {/* Resolution Description */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Descrição da Resolução</label>
              {isEditing ? (
                <Textarea
                  value={formData.resolutionDescription || report.resolutionDescription || ""}
                  onChange={(e) => setFormData({ ...formData, resolutionDescription: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{report.resolutionDescription || "-"}</p>
              )}
            </div>

            {/* Save/Delete Buttons */}
            {isEditing && canEdit && (
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
                {user?.role === "admin" && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar Report
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status History */}
        {report.history && report.history.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Histórico de Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.history.map((entry: any, index: number) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {entry.previousStatus} → {entry.newStatus}
                      </p>
                      <p className="text-sm text-gray-600">Por: {entry.changedByName}</p>
                      {entry.reason && <p className="text-sm text-gray-600 mt-1">{entry.reason}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comentários</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment */}
            {canEdit && (
              <div className="mb-6 pb-6 border-b">
                <Textarea
                  placeholder="Adicionar um comentário..."
                  value={formData.newComment || ""}
                  onChange={(e) => setFormData({ ...formData, newComment: e.target.value })}
                  rows={3}
                  className="mb-2"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={commentMutation.isPending || !formData.newComment?.trim()}
                  size="sm"
                >
                  Adicionar Comentário
                </Button>
              </div>
            )}

            {/* Comments List */}
            {report.comments && report.comments.length > 0 ? (
              <div className="space-y-4">
                {report.comments.map((comment: any) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{comment.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum comentário ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Export Dialog */}
        <ExportReportDialog
          reportId={report.id}
          clientId={report.clientId}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      </div>
    </div>
  );
}
