import React, { useState, ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { Player } from "./pages/Player";
import { Billing } from "./pages/Billing";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { Create } from "./pages/Create";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!profile?.gdpr_consent_at && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppWrapper() {
  const location = useLocation();
  const isPlayerRoute = location.pathname.startsWith("/player");
  const isPublicRoute =
    location.pathname === "/login" || location.pathname === "/onboarding";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {!isPlayerRoute && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <div className={isPlayerRoute ? "" : "lg:pl-64"}>
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <main className={isPlayerRoute ? "" : "px-4 lg:px-8 py-8"}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/player/:id" element={<Player />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create" element={<Create />} />
            </Routes>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppWrapper />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
