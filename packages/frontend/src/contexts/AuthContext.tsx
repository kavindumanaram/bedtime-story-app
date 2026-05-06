import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Profile, Child } from "@bedtime/shared";
import { apiFetch } from "../lib/api";

const ACTIVE_CHILD_KEY = "husht_active_child_id";

type AuthContextValue = {
  userId: string | null;
  profile: Profile | null;
  children: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  reloadSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshChildren: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children: reactChildren }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveChild = (child: Child | null) => {
    setActiveChildState(child);
    if (child) {
      localStorage.setItem(ACTIVE_CHILD_KEY, child.id);
    } else {
      localStorage.removeItem(ACTIVE_CHILD_KEY);
    }
  };

  const applyChildren = (list: Child[]) => {
    setChildList(list);
    const savedId = localStorage.getItem(ACTIVE_CHILD_KEY);
    const saved = savedId ? list.find((c) => c.id === savedId) : null;
    setActiveChildState(saved ?? list[0] ?? null);
  };

  const loadMe = async () => {
    try {
      const data = await apiFetch<{ profile: Profile; children: Child[] }>("/api/auth/me");
      setProfile(data.profile);
      setUserId(data.profile.id);
      applyChildren(data.children);
    } catch {
      setProfile(null);
      setUserId(null);
      setChildList([]);
    }
  };

  useEffect(() => {
    loadMe().finally(() => setLoading(false));
  }, []);

  const reloadSession = async () => {
    await loadMe();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUserId(null);
    setProfile(null);
    setChildList([]);
    setActiveChildState(null);
  };

  const refreshProfile = async () => {
    if (!userId) return;
    try {
      const data = await apiFetch<{ profile: Profile; children: Child[] }>("/api/auth/me");
      setProfile(data.profile);
    } catch {/* ignore */}
  };

  const refreshChildren = async () => {
    if (!userId) return;
    try {
      const list = await apiFetch<Child[]>("/api/children");
      applyChildren(list);
    } catch {/* ignore */}
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        profile,
        children: childList,
        activeChild,
        setActiveChild,
        loading,
        signOut,
        reloadSession,
        refreshProfile,
        refreshChildren,
      }}
    >
      {reactChildren}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
