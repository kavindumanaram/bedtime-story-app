import React, { useState } from "react";
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

function AppWrapper() {
  const location = useLocation();
  const isPlayerRoute = location.pathname.startsWith("/player");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hide sidebar on player route to maximize space */}
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
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
