import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DuplicateAlertProps {
  clientId: string;
  count: number;
  onClose?: () => void;
}

export function DuplicateAlert({ clientId, count, onClose }: DuplicateAlertProps) {
  if (count < 2) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Cuidado! Chamado Duplicado</AlertTitle>
      <AlertDescription className="text-orange-700 mt-2">
        <p>
          O cliente <strong>{clientId}</strong> já possui <strong>{count} reports</strong> no sistema.
        </p>
        <p className="mt-1">
          ⚠️ Fique atento para que este chamado não se torne crítico. Considere consolidar ou revisar os reports existentes.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-900 underline"
          >
            Entendi
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
