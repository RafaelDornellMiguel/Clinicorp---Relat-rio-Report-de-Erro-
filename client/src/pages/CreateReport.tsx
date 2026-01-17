import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CreateReport() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    clientId: "",
    key: "",
    modules: "",
    origin: "Onboarding",
    reason: "EmAnalise",
    assignedAgent: user?.name || "",
    records: "",
    status: "NoPrazo",
    ticketUrl: "",
    recommendedAction: "",
    priority: "Medium",
  });

  const createMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("Report criado com sucesso!");
      setLocation("/reports");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar report");
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
            <p className="text-gray-600">Apenas administradores podem criar novos reports.</p>
            <Button onClick={() => setLocation("/reports")} className="mt-4 w-full">
              Voltar para Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId.trim()) {
      toast.error("ID do cliente é obrigatório");
      return;
    }

    if (!formData.key.trim()) {
      toast.error("Chave é obrigatória");
      return;
    }

    try {
      const result = await createMutation.mutateAsync(formData);
      // Redirect to reports list after creation
      setTimeout(() => setLocation("/reports"), 500);
    } catch (error) {
      console.error("Error creating report:", error);
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
            <h1 className="text-3xl font-bold text-gray-900">Criar Novo Report</h1>
            <p className="text-gray-600">Preencha os dados do novo report de erro</p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client ID and Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">ID do Cliente *</label>
                  <Input
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    placeholder="ex: clinicaluminacb"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Chave (Timestamp) *</label>
                  <Input
                    required
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="ex: 1765482527707"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select
                    value={formData.status}
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
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prioridade</label>
                  <Select
                    value={formData.priority}
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
                </div>
              </div>

              {/* Reason and Origin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Motivo</label>
                  <Select
                    value={formData.reason}
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
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Origem</label>
                  <Select
                    value={formData.origin}
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
                </div>
              </div>

              {/* Assigned Agent and Ticket URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Agente Responsável</label>
                  <Input
                    value={formData.assignedAgent}
                    onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
                    placeholder="Nome do agente"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">URL do Ticket</label>
                  <Input
                    value={formData.ticketUrl}
                    onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Modules */}
              <div>
                <label className="text-sm font-medium text-gray-700">Módulos Importados</label>
                <Textarea
                  value={formData.modules}
                  onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
                  placeholder="Dados Cadastrais, Agendamento, Ficha Clínica, Financeiro Paciente"
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Records */}
              <div>
                <label className="text-sm font-medium text-gray-700">Registros Afetados</label>
                <Textarea
                  value={formData.records}
                  onChange={(e) => setFormData({ ...formData, records: e.target.value })}
                  placeholder="Descrição dos registros afetados"
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Recommended Action */}
              <div>
                <label className="text-sm font-medium text-gray-700">Ação Recomendada</label>
                <Input
                  value={formData.recommendedAction}
                  onChange={(e) => setFormData({ ...formData, recommendedAction: e.target.value })}
                  placeholder="ex: Reversão, Ajuste, Análise"
                  className="mt-1"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/reports")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
