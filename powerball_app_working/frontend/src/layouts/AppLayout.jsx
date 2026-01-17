import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import ErrorBoundary from "../components/ErrorBoundary";

/**
 * AppLayout — Layout canónico de la aplicación
 */
export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header global */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="app-container py-3">
          <Header />
        </div>
      </header>

      {/* Main content */}
      <main className="app-container app-page">
        {/* 🔑 key fuerza reset del ErrorBoundary al cambiar de ruta */}
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
