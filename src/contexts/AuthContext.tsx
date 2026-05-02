import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, type Profile, type Child } from "../lib/supabase";

const ACTIVE_CHILD_KEY = "husht_active_child_id";

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  children: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshChildren: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children: reactChildren }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
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

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  };

  const fetchChildren = async (userId: string) => {
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("parent_id", userId)
      .order("created_at");
    const list = data ?? [];
    setChildList(list);
    const savedId = localStorage.getItem(ACTIVE_CHILD_KEY);
    const saved = savedId ? list.find((c) => c.id === savedId) : null;
    setActiveChildState(saved ?? list[0] ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        Promise.all([fetchProfile(session.user.id), fetchChildren(session.user.id)]).finally(
          () => setLoading(false)
        );
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchChildren(session.user.id);
      } else {
        setProfile(null);
        setChildList([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session) await fetchProfile(session.user.id);
  };

  const refreshChildren = async () => {
    if (session) await fetchChildren(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        children: childList,
        activeChild,
        setActiveChild,
        loading,
        signOut,
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
