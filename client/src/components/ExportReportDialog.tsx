import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportReportDialogProps {
  reportId: number;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportReportDialog({
  reportId,
  clientId,
  open,
  onOpenChange,
}: ExportReportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  const pdfMutation = trpc.export.pdf.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const binaryString = atob(data.buffer);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Relatório PDF exportado com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao exportar PDF");
    },
  });

  const excelMutation = trpc.export.excel.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const binaryString = atob(data.buffer);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Relatório Excel exportado com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao exportar Excel");
    },
  });

  const handleExport = async () => {
    if (exportFormat === "pdf") {
      await pdfMutation.mutateAsync(reportId);
    } else {
      await excelMutation.mutateAsync(reportId);
    }
  };

  const isLoading = pdfMutation.isPending || excelMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Escolha o formato para exportar o relatório de {clientId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="pdf"
                  name="format"
                  value="pdf"
                  checked={exportFormat === "pdf"}
                  onChange={(e) => setExportFormat(e.target.value as "pdf")}
                  className="h-4 w-4"
                />
                <label htmlFor="pdf" className="ml-2 text-sm cursor-pointer">
                  PDF - Relatório formatado para impressão
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="excel"
                  name="format"
                  value="excel"
                  checked={exportFormat === "excel"}
                  onChange={(e) => setExportFormat(e.target.value as "excel")}
                  className="h-4 w-4"
                />
                <label htmlFor="excel" className="ml-2 text-sm cursor-pointer">
                  Excel - Planilha com histórico completo
                </label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">O que será incluído:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Informações completas do report</li>
              <li>Histórico de mudanças de status</li>
              <li>Comentários e anotações</li>
              {exportFormat === "excel" && <li>Dados estruturados em abas separadas</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Exportar {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
