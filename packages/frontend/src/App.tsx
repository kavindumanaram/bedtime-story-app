import { useState, useEffect, ReactNode, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Index } from "./pages/Index";
import { Index2 } from "./pages/Index2";
import { Library1 } from "./pages/Library1";
import { Login1 } from "./pages/Login1";
import { Signup1 } from "./pages/Signup1";
import { Onboarding1 } from "./pages/Onboarding1";
import { SelectProfiles1 } from "./pages/SelectProfiles1";
import Player1 from "./pages/Player1";
import Create1 from "./pages/Create1";
import { TempMenu } from "./components/TempMenu";
import { Spinner1 } from "./components/Spinner1";
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
import { ProfileSelectionProvider, useProfileSelection } from "./contexts/ProfileSelectionContext";
import { PlayerProvider, usePlayer, type PlayerRouterState } from "./contexts/PlayerContext";

const ProfileSelection = lazy(() => import("./pages/ProfileSelection").then(m => ({ default: m.ProfileSelection })))

// ── Netflix-style overlay player ───────────────────────────────────────────────
function PlayerOverlayWrapper({
  entry,
  onClose,
}: {
  entry: { id: string; state?: PlayerRouterState };
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "#030712",
        overflowY: "auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 280ms ease",
      }}
    >
      {/* Floating back arrow — stays pinned while scrolling */}
      <button
        onClick={handleClose}
        aria-label="Back"
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 110,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
          color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 150ms, transform 150ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.65)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <Player overlayId={entry.id} overlayState={entry.state} overlayMode />
    </div>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { userId, profile, loading } = useAuth();
  const { profileSelected } = useProfileSelection();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!userId) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!profile?.gdpr_consent_at && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!profileSelected && location.pathname !== "/profiles") {
    return <Navigate to="/profiles" replace />;
  }

  return <>{children}</>;
}

function AppWrapper() {
  const { playerEntry, closePlayer } = usePlayer();
  const location = useLocation();
  const isPlayerRoute = location.pathname.startsWith("/player");
  const isHomeRoute = false;
  const isProfilesRoute = location.pathname === "/profiles";
  const isPublicRoute =
    location.pathname === "/login" ||
    location.pathname === "/onboarding" ||
    location.pathname === "/login1" ||
    location.pathname === "/signup1" ||
    location.pathname === "/onboarding1" ||
    location.pathname === "/profiles1" ||
    location.pathname === "/create1" ||
    location.pathname.startsWith("/player1") ||
    location.pathname === "/index2" ||
    location.pathname === "/library1";
  const isFullscreen = isPlayerRoute || isHomeRoute || isProfilesRoute;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login1" element={<Login1 />} />
        <Route path="/signup1" element={<Signup1 />} />
        <Route path="/onboarding1" element={<Onboarding1 />} />
        <Route path="/profiles1" element={<SelectProfiles1 />} />
        <Route path="/create1" element={<Create1 />} />
        <Route path="/player1" element={<Player1 />} />
        <Route path="/player1/:id" element={<Player1 />} />
        <Route path="/index2" element={<Index2 />} />
        <Route path="/library1" element={<Library1 />} />
        <Route path="/spinner1" element={<Spinner1 />} />
        <Route path="/menu1" element={<TempMenu />} />
      </Routes>
    );
  }

  return (
    <AuthGuard>
      <div className={`min-h-screen ${isProfilesRoute ? '' : 'bg-gradient-to-b from-[#FFF8FF] via-[#F6FBFF] to-[#F4F3F9]'}`}>
        {!isFullscreen && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <div className={isFullscreen ? "" : "lg:pl-64"}>
          {!isFullscreen && (
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
          )}

          <main className={isFullscreen ? "" : "px-4 lg:px-8 py-8"}>
            <Routes>
              <Route path="/" element={<Index2 />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/index" element={<Index />} />
              <Route path="/index2" element={<Index2 />} />
              <Route path="/library1" element={<Library1 />} />
              <Route path="/login1" element={<Login1 />} />
              <Route path="/signup1" element={<Signup1 />} />
              <Route path="/onboarding1" element={<Onboarding1 />} />
              <Route path="/profiles1" element={<SelectProfiles1 />} />
              <Route path="/player1" element={<Player1 />} />
              <Route path="/player1/:id" element={<Player1 />} />
              <Route path="/spinner1" element={<Spinner1 />} />
              <Route path="/menu1" element={<TempMenu />} />
              <Route path="/create1" element={<Create1 />} />
              <Route path="/profiles" element={
                <Suspense fallback={<div className="min-h-screen animate-pulse" style={{ background: 'linear-gradient(135deg,#5DBB63,#8EE3A0)' }} />}>
                  <ProfileSelection />
                </Suspense>
              } />
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

      {/* Netflix-style overlay player — rendered on top of whatever page is active */}
      {playerEntry && (
        <PlayerOverlayWrapper entry={playerEntry} onClose={closePlayer} />
      )}
    </AuthGuard>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <PlayerProvider>
            <ProfileSelectionProvider>
              <AppWrapper />
            </ProfileSelectionProvider>
          </PlayerProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
