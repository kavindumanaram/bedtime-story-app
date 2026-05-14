import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Tab = "signin" | "signup";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { reloadSession } = useAuth();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (tab === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Signup failed");
        }
        await reloadSession();
        navigate("/profiles");
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Invalid credentials");
        }
        await reloadSession();
        navigate("/profiles");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = "/api/auth/oauth/google";
  };

  const KEYFRAMES = `
    @keyframes floatStar {
      0%,100% { transform: translateY(0px) rotate(-5deg); }
      50%      { transform: translateY(-20px) rotate(5deg); }
    }
    @keyframes twinkle {
      0%,100% { opacity: 0.15; transform: scale(0.7); }
      50%      { opacity: 0.8; transform: scale(1.2); }
    }
  `

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)' }}>
      <style>{KEYFRAMES}</style>

      {/* Glow orbs */}
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(124,58,237,0.35) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:350, height:350, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(6,182,212,0.25) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* Floating emoji decorations */}
      {[
        { ch:'🌙', top:'8%',  left:'6%',  size:42, dur:'7s',  delay:'0s'   },
        { ch:'⭐', top:'15%', right:'8%', size:28, dur:'9s',  delay:'1.5s' },
        { ch:'✨', top:'70%', left:'4%',  size:22, dur:'6s',  delay:'0.8s' },
        { ch:'🏰', top:'75%', right:'6%', size:36, dur:'8s',  delay:'2s'   },
        { ch:'💫', top:'40%', left:'2%',  size:18, dur:'5.5s',delay:'1s'   },
      ].map((d, i) => (
        <div key={i} style={{
          position:'absolute', top: d.top, left: (d as {left?:string}).left, right: (d as {right?:string}).right,
          fontSize: d.size, pointerEvents:'none', userSelect:'none',
          animation:`floatStar ${d.dur} ease-in-out ${d.delay} infinite`,
          opacity:0.6,
        }}>{d.ch}</div>
      ))}

      {/* Twinkle dots */}
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{
          position:'absolute',
          top:`${12 + i * 13}%`, left:`${8 + ((i*17)%80)}%`,
          width:3, height:3, borderRadius:'50%', background:'#c4b5fd',
          animation:`twinkle ${1.5 + i*0.4}s ease-in-out ${i*0.4}s infinite`,
          pointerEvents:'none',
        }} />
      ))}

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background:'rgba(245,183,49,0.15)', border:'1.5px solid rgba(245,183,49,0.3)' }}>
            <Moon className="w-8 h-8" style={{ color:'#F5B731' }} />
          </div>
          <h1 className="text-3xl font-black text-white" style={{ letterSpacing:'-0.02em' }}>
            <span style={{ color:'#F5B731' }}>Hush</span>Tales
          </h1>
          <p className="text-white/50 mt-1 text-sm">Personalised bedtime stories for your little ones</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8"
          style={{ background:'rgba(255,255,255,0.07)', backdropFilter:'blur(24px)', border:'1.5px solid rgba(255,255,255,0.12)' }}>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background:'rgba(0,0,0,0.3)' }}>
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={tab === t
                  ? { background:'linear-gradient(135deg,#7c3aed,#06b6d4)', color:'#fff' }
                  : { color:'rgba(255,255,255,0.45)' }
                }
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors mb-4"
            style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.18)', color:'#fff' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.15)' }} />
            <span className="text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>or</span>
            <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'rgba(255,255,255,0.45)' }}>Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'rgba(255,255,255,0.35)' }} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="parent@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.15)' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color:'rgba(255,255,255,0.45)' }}>Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'rgba(255,255,255,0.35)' }} />
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.15)' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color:'rgba(255,255,255,0.35)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {tab === "signin" && (
              <div className="text-right">
                <button type="button" className="text-xs transition-colors"
                  style={{ color:'rgba(124,58,237,0.8)' }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm px-4 py-3 rounded-xl" style={{ color:'#fca5a5', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)' }}>{error}</p>
            )}
            {success && (
              <p className="text-sm px-4 py-3 rounded-xl" style={{ color:'#86efac', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)' }}>{success}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow:'0 8px 24px rgba(124,58,237,0.4)' }}>
              {loading ? "Please wait…" : tab === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color:'rgba(255,255,255,0.25)' }}>
          By continuing you agree to our{" "}
          <a href="#" className="underline hover:text-white/50">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-white/50">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
