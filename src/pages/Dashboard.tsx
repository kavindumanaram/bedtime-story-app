import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/StatCard";
import { Card } from "../components/Card";
import { BarChartCard } from "../components/BarChartCard";
import { LineChartCard } from "../components/LineChartCard";
import {
  BookOpen, Clock, Flame, ArrowRight, Moon, Sparkles,
  Play, RefreshCw, AlertCircle, Star,
} from "lucide-react";
import { listeningSessionsData, sleepScoreData } from "../data/mock";
import { useAuth } from "../contexts/AuthContext";
import { getTonightAssignment, triggerRead, PlanLimitError } from "../api/dailyStory";
import { getMemoryContext, getChildStreak, getTopCharacters } from "../api/storyMemory";
import { triggerContinuation } from "../api/storyContinuation";
import { storyTemplates } from "../data/storyTemplates";
import { renderTemplate, pickTonightTemplateWithMemory } from "../lib/templateEngine";
import type { DailyStory, ChildStreak } from "../lib/supabase";

type CardState = "idle" | "loading" | "error";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild, profile } = useAuth();

  const [assignment, setAssignment] = useState<DailyStory | null>(null);
  const [tonightTitle, setTonightTitle] = useState<string>("");
  const [tonightTheme, setTonightTheme] = useState<string>("");
  const [streak, setStreak] = useState<ChildStreak | null>(null);
  const [memory, setMemory] = useState<Awaited<ReturnType<typeof getMemoryContext>>>(null);
  const [characters, setCharacters] = useState<{ name: string; description: string | null }[]>([]);
  const [readState, setReadState] = useState<CardState>("idle");
  const [continueState, setContinueState] = useState<CardState>("idle");
  const [limitError, setLimitError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ count: number; limit: number } | null>(null);

  // Reset stale data the instant a different child is selected
  useEffect(() => {
    setAssignment(null);
    setTonightTitle("");
    setTonightTheme("");
    setStreak(null);
    setMemory(null);
    setCharacters([]);
    setLimitError(null);
    setReadState("idle");
    setContinueState("idle");
    setQuota(null);
  }, [activeChild?.id]);

  const loadDashboard = useCallback(async () => {
    if (!activeChild || !profile) return;

    // 1. Show title immediately from local template engine — zero Supabase required
    const localTemplate = pickTonightTemplateWithMemory(activeChild, new Date(), []);
    const localRendered = renderTemplate(localTemplate, { childName: activeChild.name, age: activeChild.age });
    setTonightTitle(localRendered.title);
    setTonightTheme(localTemplate.theme);

    // 2. Fetch memory / streak / characters — each fails independently
    const [memResult, streakResult, charsResult] = await Promise.allSettled([
      getMemoryContext(activeChild.id),
      getChildStreak(activeChild.id),
      getTopCharacters(activeChild.id, 2),
    ]);
    const mem = memResult.status === "fulfilled" ? memResult.value : null;
    const streakData = streakResult.status === "fulfilled" ? streakResult.value : null;
    const chars = charsResult.status === "fulfilled" ? charsResult.value : [];
    setMemory(mem);
    setStreak(streakData);
    setCharacters(chars);

    // 3. Create tonight's daily_stories row — graceful fallback if table doesn't exist
    let resolvedTemplate = localTemplate;
    try {
      const disliked = (mem as any)?.dislikedThemes ?? [];
      const a = await getTonightAssignment(activeChild, profile.id, disliked);
      setAssignment(a);
      const t = storyTemplates.find((s) => s.id === a.template_id);
      if (t) {
        resolvedTemplate = t;
        const r = renderTemplate(t, { childName: activeChild.name, age: activeChild.age });
        setTonightTitle(r.title);
        setTonightTheme(t.theme);
      }
    } catch {
      // daily_stories table not yet set up — use a virtual local assignment so Read Now still works
      setAssignment({
        id: "local",
        child_id: activeChild.id,
        parent_id: profile.id,
        story_date: new Date().toISOString().slice(0, 10),
        template_id: resolvedTemplate.id,
        story_id: null,
        is_generated: false,
        created_at: new Date().toISOString(),
      } as DailyStory);
    }

    // 4. Quota display for Basic plan
    if (profile.plan === "basic") {
      try {
        const { data } = await import("../lib/supabase").then(({ supabase }) =>
          supabase.from("usage_quotas").select("monthly_ai_count, monthly_ai_limit").eq("user_id", profile.id).single()
        );
        if (data) setQuota({ count: data.monthly_ai_count, limit: data.monthly_ai_limit });
      } catch { /* table may not exist yet */ }
    }
  }, [activeChild, profile]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleReadNow = async () => {
    if (!assignment || !activeChild || !profile) return;
    setReadState("loading");
    setLimitError(null);
    try {
      const storyId = await triggerRead(assignment, activeChild, profile);
      navigate(`/player/${storyId}`);
    } catch (e) {
      if (e instanceof PlanLimitError) setLimitError(e.message);
      else setReadState("error");
    }
  };

  const handleContinue = async () => {
    if (!activeChild || !profile) return;
    setContinueState("loading");
    setLimitError(null);
    try {
      const storyId = await triggerContinuation(activeChild, profile);
      navigate(`/player/${storyId}`);
    } catch (e) {
      if (e instanceof PlanLimitError) setLimitError(e.message);
      else setContinueState("error");
    }
  };

  const planBadge = () => {
    if (!profile) return null;
    if (profile.plan === "free") return (
      <span className="text-xs text-gray-400 flex items-center gap-1">
        🔒 Free plan · Template story
      </span>
    );
    if (profile.plan === "basic" && quota) return (
      <span className="text-xs text-gray-400">
        ✦ AI story · {quota.count}/{quota.limit} used this month
      </span>
    );
    return <span className="text-xs text-primary">✦ Premium · Unlimited stories</span>;
  };

  return (
    <div className="space-y-6">
      {/* Active child header */}
      {activeChild && (
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: activeChild.avatar_color }}
          >
            {activeChild.name[0].toUpperCase()}
          </span>
          <p className="text-sm text-gray-500">
            Showing stats for <span className="font-semibold text-gray-700">{activeChild.name}</span>
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Sleep Streak"
          value={streak ? String(streak.current_streak) : "0"}
          icon={Flame}
          trend={streak?.current_streak ? "Days in a row 🔥" : "Start tonight!"}
        />
        <StatCard title="Minutes Listened" value="47" icon={Clock} trend="This week" />
        <StatCard
          title="Stories Read"
          value={streak ? String(streak.longest_streak) : "0"}
          icon={BookOpen}
          trend="Longest streak"
        />
        <StatCard title="New Stories" value="3" icon={Sparkles} trend="This month" />
      </div>

      {/* Limit error banner */}
      {limitError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{limitError}{" "}
            <button onClick={() => navigate("/billing")} className="underline font-medium">Upgrade →</button>
          </span>
        </div>
      )}

      {/* Hero row: Tonight's Story + Continue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tonight's Story card */}
        {activeChild ? (
          <Card className="relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)" }}
            />
            <div className="relative p-8 text-white h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-white/60" />
                <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  Tonight's Story for {activeChild.name}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2 leading-snug">
                {tonightTitle || "Loading…"}
              </h2>
              <p className="text-white/70 text-sm mb-1 capitalize">{tonightTheme}</p>
              <div className="mt-auto space-y-3">
                {planBadge()}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleReadNow}
                    disabled={readState === "loading" || !assignment}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 text-sm"
                  >
                    {readState === "loading"
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
                      : <><Play className="w-4 h-4" /> Read Now</>}
                  </button>
                  {(profile?.plan === "basic" || profile?.plan === "premium") && (
                    <button
                      onClick={() => { setAssignment(null); loadDashboard(); }}
                      title="Pick a different story"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {readState === "error" && (
                  <p className="text-red-300 text-xs">Something went wrong. Please try again.</p>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <p className="text-gray-500 text-sm">Select a child in the sidebar to see tonight's story.</p>
          </Card>
        )}

        {/* Continue Yesterday / Welcome card */}
        {memory?.lastTitle ? (
          <Card className="p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Continue the Story</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1 leading-snug">
              {memory.lastTitle}
            </h2>
            <p className="text-sm text-gray-500 mb-1 line-clamp-2">{memory.lastSummary}</p>

            {/* Character chips */}
            {characters.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2 mb-4">
                {characters.map((c) => (
                  <span key={c.name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Star className="w-3 h-3" />
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto">
              <button
                onClick={handleContinue}
                disabled={continueState === "loading"}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {continueState === "loading"
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
                  : <><ArrowRight className="w-4 h-4" /> Continue →</>}
              </button>
              {continueState === "error" && (
                <p className="text-red-500 text-xs mt-2">Something went wrong. Please try again.</p>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Welcome to HushTales</h2>
              <p className="text-gray-600 mb-6 flex-1 text-sm">
                Create magical bedtime moments with personalised AI stories. Each night a new tale waits — tap Read Now to begin.
              </p>
              <button
                onClick={() => navigate("/library")}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors self-start text-sm"
              >
                Explore Stories <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Listening Sessions (Last 7 days)"
          data={listeningSessionsData}
          dataKey="sessions"
          xAxisKey="day"
        />
        <LineChartCard title="Sleep Calm Score (Last 30 days)" data={sleepScoreData} />
      </div>
    </div>
  );
};
