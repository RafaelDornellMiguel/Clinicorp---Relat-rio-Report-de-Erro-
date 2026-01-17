import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { SidebarNav } from "@/components/SidebarNav";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import BulkActions from "./pages/BulkActions";
import ImportReports from "./pages/ImportReports";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

function MainContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">📋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Inconsistência</h1>
            <p className="text-gray-600 mt-2">Clinicorp - Acompanhamento de Erros em Tempo Real</p>
          </div>

          <p className="text-gray-600 text-center mb-6">
            Faça login para acessar o sistema de acompanhamento de reports de erro.
          </p>

          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg"
          >
            Fazer Login
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Você será redirecionado para o portal de login da Clinicorp
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "reports":
        return <Reports />;
      case "analytics":
        return <Analytics />;
      case "bulk-actions":
        return user?.role === "admin" ? <BulkActions /> : <NotFound />;
      case "import":
        return user?.role === "admin" ? <ImportReports /> : <NotFound />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarNav currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentPage === "dashboard" && "Dashboard"}
              {currentPage === "reports" && "Reports de Erro"}
              {currentPage === "analytics" && "Analytics"}
              {currentPage === "bulk-actions" && "Ações em Massa"}
              {currentPage === "import" && "Importar Reports"}
            </h2>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <MainContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
