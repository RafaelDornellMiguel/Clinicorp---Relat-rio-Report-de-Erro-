import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileUp,
  Loader2,
  Download,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface PreviewData {
  rows: Record<string, string>[];
  columns: string[];
  fileName: string;
}

interface FieldMapping {
  [key: string]: string;
}

const DEFAULT_FIELDS = [
  "clientId",
  "key",
  "modulesImported",
  "origin",
  "reason",
  "assignedAgent",
  "records",
  "status",
];

export default function ImportReports() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const importMutation = trpc.import.uploadReports.useMutation();

  // Only admins can access this page
  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem importar reports.</p>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      toast.error("Arquivo inválido. Use CSV ou Excel (.xlsx)");
      return;
    }

    setIsLoading(true);
    try {
      const fileContent = await file.arrayBuffer();
      const base64Content = Buffer.from(fileContent).toString("base64");

      // Parse file to get preview
      const response = await fetch("/api/trpc/import.preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent: base64Content,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar arquivo");
      }

      const data = await response.json();
      if (data.result?.data) {
        setPreviewData({
          rows: data.result.data.rows,
          columns: data.result.data.columns,
          fileName: file.name,
        });
        setImportResult(null);

        // Auto-map fields
        const autoMapping: FieldMapping = {};
        data.result.data.columns.forEach((col: string) => {
          const lowerCol = col.toLowerCase();
          const matchedField = DEFAULT_FIELDS.find((f) =>
            lowerCol.includes(f.toLowerCase()) || f.toLowerCase().includes(lowerCol)
          );
          if (matchedField) {
            autoMapping[col] = matchedField;
          }
        });
        setFieldMapping(autoMapping);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar arquivo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setIsLoading(true);
    try {
      const fileContent = await (fileInputRef.current?.files?.[0] as File).arrayBuffer();
      const base64Content = Buffer.from(fileContent).toString("base64");

      const result = await importMutation.mutateAsync({
        fileContent: base64Content,
        fileName: previewData.fileName,
      });

      setImportResult(result);
      if (result.failed === 0) {
        toast.success(`${result.success} reports importados com sucesso!`);
        setPreviewData(null);
        setFieldMapping({});
      } else {
        toast.warning(
          `${result.success} importados, ${result.failed} falharam. Verifique os erros.`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = DEFAULT_FIELDS.join(",");
    const template = `${headers}\nCLIENT001,KEY001,Modulo1,Onboarding,ClientBase,Sarah,Registro1,NoPrazo`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-reports.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Importar Reports</h1>
        <p className="text-gray-600">
          Importe reports em massa via CSV ou Excel. Valide os dados antes de confirmar a importação.
        </p>
      </div>

      {/* Upload Area */}
      {!previewData ? (
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-primary rounded-lg p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Arraste o arquivo aqui
              </h3>
              <p className="text-gray-600 mb-4">ou clique para selecionar</p>
              <p className="text-sm text-gray-500">Suportados: CSV, Excel (.xlsx)</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>

            <div className="mt-6 flex gap-4">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Preview Section */}
      {previewData && !importResult ? (
        <div className="space-y-4">
          {/* File Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileUp className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{previewData.fileName}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {previewData.rows.length} linhas, {previewData.columns.length} colunas
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewData(null);
                    setFieldMapping({});
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Field Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapeamento de Campos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewData.columns.map((col) => (
                  <div key={col} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{col}</label>
                    <select
                      value={fieldMapping[col] || ""}
                      onChange={(e) =>
                        setFieldMapping({ ...fieldMapping, [col]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Ignorar</option>
                      {DEFAULT_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {previewData.columns.map((col) => (
                        <th key={col} className="px-4 py-2 text-left font-semibold text-gray-900">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        {previewData.columns.map((col) => (
                          <td key={`${idx}-${col}`} className="px-4 py-2 text-gray-600">
                            {row[col] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.rows.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... e mais {previewData.rows.length - 5} linhas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="gap-2 bg-primary hover:bg-primary-dark text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Importar {previewData.rows.length} Reports
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewData(null);
                setFieldMapping({});
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {/* Import Result */}
      {importResult ? (
        <Card
          className={
            importResult.failed === 0
              ? "border-success bg-success/5"
              : "border-warning bg-warning/5"
          }
        >
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {importResult.failed === 0 ? (
                <CheckCircle className="h-8 w-8 text-success flex-shrink-0" />
              ) : (
                <AlertCircle className="h-8 w-8 text-warning flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Importação Concluída</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>✓ {importResult.success} reports importados com sucesso</p>
                  {importResult.failed > 0 && (
                    <>
                      <p>✗ {importResult.failed} reports falharam</p>
                      {importResult.errors.length > 0 && (
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <p className="font-medium text-gray-900 mb-2">Erros:</p>
                          <ul className="space-y-1 text-xs">
                            {importResult.errors.slice(0, 5).map((error, idx) => (
                              <li key={idx} className="text-danger">
                                {error}
                              </li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li className="text-gray-500">
                                ... e mais {importResult.errors.length - 5} erros
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setImportResult(null);
                    setPreviewData(null);
                    setFieldMapping({});
                  }}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar Outro Arquivo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Integration Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">Integrações Futuras</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            Este sistema está preparado para integração com <strong>N8n</strong> e{" "}
            <strong>HubSpot</strong>. Em breve você poderá:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Sincronizar automaticamente reports do HubSpot</li>
            <li>Usar N8n para automações customizadas</li>
            <li>Receber webhooks de sistemas externos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
