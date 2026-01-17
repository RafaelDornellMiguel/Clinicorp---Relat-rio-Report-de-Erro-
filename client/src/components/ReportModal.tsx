import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { ErrorReport } from "@shared/types";

interface ReportModalProps {
  report: ErrorReport | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const statusConfig = {
  NoPrazo: { label: "No Prazo", color: "bg-blue-100 text-blue-800", icon: Clock },
  SLAVencida: { label: "SLA Vencida", color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
  Critico: { label: "Crítico", color: "bg-red-100 text-red-800", icon: AlertCircle },
  Resolvido: { label: "Resolvido", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

const reasonConfig = {
  ClientBase: "Cliente Base",
  Modelador: "Modelador",
  Analista: "Analista",
  Engenharia: "Engenharia",
  EmAnalise: "Em Análise",
  Outro: "Outro",
};

export function ReportModal({ report, isOpen, onClose, onEdit }: ReportModalProps) {
  if (!report) return null;

  const statusInfo = statusConfig[report.status as keyof typeof statusConfig];
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5" />
            Report #{report.id} - {report.clientId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={statusInfo?.color}>
              {statusInfo?.label}
            </Badge>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Chave</p>
              <p className="text-gray-900">{report.key}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Origem</p>
              <p className="text-gray-900">{report.origin}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Motivo</p>
              <p className="text-gray-900">
                {reasonConfig[report.reason as keyof typeof reasonConfig] || report.reason}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Agente Responsável</p>
              <p className="text-gray-900">{report.assignedAgent || "Não atribuído"}</p>
            </div>
          </div>

          {/* Módulos */}
          {report.modules && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Módulos Importados</p>
              <p className="text-gray-900 text-sm">{report.modules}</p>
            </div>
          )}

          {/* Registros */}
          {report.records && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Registros</p>
              <p className="text-gray-900 text-sm">{report.records}</p>
            </div>
          )}

          {/* Ticket URL */}
          {report.ticketUrl && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Ticket</p>
              <a
                href={report.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                {report.ticketUrl}
              </a>
            </div>
          )}

          {/* Ação Recomendada */}
          {report.recommendedAction && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Ação Recomendada</p>
              <p className="text-gray-900 text-sm">{report.recommendedAction}</p>
            </div>
          )}

          {/* Descrição da Resolução */}
          {report.resolutionDescription && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Descrição da Resolução</p>
              <p className="text-gray-900 text-sm">{report.resolutionDescription}</p>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Criado em</p>
              <p className="text-gray-900">{new Date(report.createdAt).toLocaleString("pt-BR")}</p>
            </div>
            {report.resolutionDate && (
              <div>
                <p className="text-gray-600">Resolvido em</p>
                <p className="text-gray-900">{new Date(report.resolutionDate).toLocaleString("pt-BR")}</p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            {onEdit && (
              <Button onClick={onEdit} className="bg-primary hover:bg-primary-dark">
                Editar
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
