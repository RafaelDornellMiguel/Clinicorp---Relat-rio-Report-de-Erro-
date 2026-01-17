import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateReportModal({ isOpen, onClose, onSuccess }: CreateReportModalProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    key: "",
    modules: "",
    origin: "Onboarding",
    reason: "EmAnalise",
    assignedAgent: "",
    records: "",
    status: "NoPrazo",
    ticketUrl: "",
    recommendedAction: "",
  });

  const createMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("Report criado com sucesso!");
      setFormData({
        clientId: "",
        key: "",
        modules: "",
        origin: "Onboarding",
        reason: "EmAnalise",
        assignedAgent: "",
        records: "",
        status: "NoPrazo",
        ticketUrl: "",
        recommendedAction: "",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao criar report: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId.trim()) {
      toast.error("ID do cliente é obrigatório");
      return;
    }

    if (!formData.key.trim()) {
      toast.error("Chave é obrigatória");
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID do Cliente */}
          <div>
            <label className="text-sm font-semibold text-gray-700">ID do Cliente *</label>
            <Input
              placeholder="Ex: clinicaluminacb"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Chave */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Chave (Timestamp) *</label>
            <Input
              placeholder="Ex: 1768221842135"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Módulos */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Módulos Importados</label>
            <Textarea
              placeholder="Ex: Dados Cadastrais, Agendamento, Ficha Clínica"
              value={formData.modules}
              onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Origem */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Origem</label>
            <Select value={formData.origin} onValueChange={(value) => setFormData({ ...formData, origin: value })}>
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

          {/* Motivo */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Motivo</label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ClientBase">Cliente Base</SelectItem>
                <SelectItem value="Modelador">Modelador</SelectItem>
                <SelectItem value="Analista">Analista</SelectItem>
                <SelectItem value="Engenharia">Engenharia</SelectItem>
                <SelectItem value="EmAnalise">Em Análise</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agente */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Agente Responsável</label>
            <Input
              placeholder="Nome do agente"
              value={formData.assignedAgent}
              onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Registros */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Registros</label>
            <Textarea
              placeholder="Descrição dos registros afetados"
              value={formData.records}
              onChange={(e) => setFormData({ ...formData, records: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NoPrazo">No Prazo</SelectItem>
                <SelectItem value="SLAVencida">SLA Vencida</SelectItem>
                <SelectItem value="Critico">Crítico</SelectItem>
                <SelectItem value="Resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket URL */}
          <div>
            <label className="text-sm font-semibold text-gray-700">URL do Ticket</label>
            <Input
              placeholder="https://..."
              value={formData.ticketUrl}
              onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Ação Recomendada */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Ação Recomendada</label>
            <Input
              placeholder="Ex: Reversão, Ajuste, etc"
              value={formData.recommendedAction}
              onChange={(e) => setFormData({ ...formData, recommendedAction: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary-dark"
            >
              {createMutation.isPending ? "Criando..." : "Criar Report"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
