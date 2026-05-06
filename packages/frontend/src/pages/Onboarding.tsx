import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Baby, CheckCircle2, Moon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../lib/api";

const AVATAR_COLORS = [
  { label: "Green", value: "#10b981" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Pink", value: "#ec4899" },
];

type Step = "welcome" | "consent" | "child";

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile, refreshChildren } = useAuth();

  const [step, setStep] = useState<Step>("welcome");
  const [isAdult, setIsAdult] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDataUse, setAcceptedDataUse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Child form
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].value);

  useEffect(() => {
    if (!showCelebration) return;
    const timer = setTimeout(() => navigate("/create"), 1400);
    return () => clearTimeout(timer);
  }, [showCelebration, navigate]);

  const handleConsent = async () => {
    if (!isAdult || !acceptedTerms || !acceptedDataUse) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ gdpr_consent_at: new Date().toISOString() }),
      });
      await refreshProfile();
      setStep("child");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save consent");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/children", {
        method: "POST",
        body: JSON.stringify({ name: childName.trim(), age: childAge, avatar_color: avatarColor }),
      });
      await refreshChildren();
      setShowCelebration(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save child profile");
      setLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)" }}
      >
        {/* Starfield */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-white/50 animate-pulse select-none"
              style={{
                left: `${(i * 17 + 5) % 95}%`,
                top: `${(i * 13 + 8) % 88}%`,
                animationDelay: `${(i * 0.25) % 2}s`,
                fontSize: i % 3 === 0 ? "18px" : "10px",
              }}
            >
              ★
            </span>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-sm w-full">
          <Moon className="w-20 h-20 text-yellow-200 mx-auto mb-6 opacity-90" />
          <h1 className="text-3xl font-bold text-white mb-4 leading-snug">
            Let's begin a magical bedtime journey
          </h1>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Every great adventure starts here. Let's create stories your child will remember forever.
          </p>
          <button
            onClick={() => setStep("consent")}
            className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold transition-colors"
          >
            Begin the Journey →
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {(["consent", "child"] as Exclude<Step, "welcome">[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  step === s
                    ? "bg-primary text-white"
                    : step === "child" && s === "consent"
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-200 text-gray-400"
                }`}>
                  {step === "child" && s === "consent"
                    ? <CheckCircle2 className="w-4 h-4" />
                    : i + 1}
                </div>
                {i === 0 && <div className={`flex-1 h-0.5 max-w-[60px] ${step === "child" ? "bg-primary" : "bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {step === "consent" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">A safe space for your child's imagination</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      HushTales creates personalised stories just for your little one. Your data stays private, always.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-600">
                  <p>• We store only your child's <strong>first name</strong> and <strong>age</strong></p>
                  <p>• Stories are private to your account</p>
                  <p>• You can export or delete all your data at any time</p>
                  <p>• No advertising, no tracking beyond your own usage</p>
                </div>

                <div className="space-y-3">
                  {[
                    { state: isAdult, set: setIsAdult, label: "I am at least 18 years old" },
                    { state: acceptedTerms, set: setAcceptedTerms, label: "I accept the Privacy Policy and Terms of Service" },
                    { state: acceptedDataUse, set: setAcceptedDataUse, label: "I consent to my child's name and age being used to generate personalised bedtime stories" },
                  ].map(({ state, set, label }) => (
                    <label key={label} className="flex items-start gap-3 cursor-pointer group">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                          state ? "bg-primary border-primary" : "border-gray-300 group-hover:border-primary/50"
                        }`}
                        onClick={() => set((s) => !s)}
                      >
                        {state && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700 leading-snug">{label}</span>
                    </label>
                  ))}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  onClick={handleConsent}
                  disabled={!isAdult || !acceptedTerms || !acceptedDataUse || loading}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  {loading ? "Saving..." : "I Agree — Continue"}
                </button>

                <p className="text-center text-xs text-gray-400">
                  You can delete all data at any time from Settings → Delete Account
                </p>
              </div>
            )}

            {step === "child" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Baby className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Who are we creating stories for?</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      We'll tailor every story to their age and name — pure magic, every bedtime.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Child's first name</span>
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="e.g. Emma"
                      autoFocus
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</span>
                    <input
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      min={1}
                      max={17}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-32"
                    />
                  </label>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pick a colour</span>
                    <div className="flex gap-3">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAvatarColor(c.value)}
                          aria-label={c.label}
                          className={`w-9 h-9 rounded-full transition-all ${
                            avatarColor === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  onClick={handleAddChild}
                  disabled={!childName.trim() || loading}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  {loading ? "Saving..." : "Let the adventure begin →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-bounce select-none"
              style={{
                left: `${10 + (i * 4.5) % 80}%`,
                top: `${20 + (i * 7) % 60}%`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: "0.6s",
              }}
            >
              {["✨", "⭐", "🌟", "💫"][i % 4]}
            </span>
          ))}
        </div>
      )}
    </>
  );
};
