import React from "react";
import { CreditCard, Download, Check, Sparkles, Zap, Crown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Plan = "free" | "basic" | "premium";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Nightly template story",
      "Streak tracking",
      "Story library",
      "Template-only — no AI",
    ],
    cta: "Current Plan",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    period: "/month",
    features: [
      "30 AI text stories / month",
      "No cover images",
      "Story continuation",
      "Character memory",
      "Preference learning",
    ],
    cta: "Upgrade to Basic",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$14.99",
    period: "/month",
    features: [
      "Unlimited AI stories",
      "AI cover image generation",
      "Story continuation + images",
      "Character memory",
      "Priority generation",
    ],
    cta: "Upgrade to Premium",
    highlight: true,
  },
];

export const Billing: React.FC = () => {
  const { profile } = useAuth();
  const currentPlan: Plan = (profile?.plan as Plan) ?? "free";

  const invoices = [
    { id: "001", date: "Jan 2026", amount: "$9.99", status: "Paid" },
    { id: "002", date: "Dec 2025", amount: "$9.99", status: "Paid" },
    { id: "003", date: "Nov 2025", amount: "$9.99", status: "Paid" },
  ];

  const PLAN_ICONS: Record<Plan, React.ReactNode> = {
    free:    <Sparkles className="w-5 h-5" style={{ color:'#9CA3AF' }} />,
    basic:   <Zap className="w-5 h-5" style={{ color:'#06b6d4' }} />,
    premium: <Crown className="w-5 h-5" style={{ color:'#F5B731' }} />,
  };

  const PLAN_GRADIENTS: Record<Plan, string> = {
    free:    'linear-gradient(135deg,#374151,#1f2937)',
    basic:   'linear-gradient(135deg,#0c4a6e,#0e7490)',
    premium: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
  };

  return (
    <div className="space-y-5">

      {/* ── Dark hero header ───────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', minHeight: 180 }}>
        <div style={{ position:'absolute', top:'-20%', right:'-5%', width:280, height:280, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(245,183,49,0.3) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30%', left:'5%', width:220, height:220, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(124,58,237,0.35) 0%,transparent 70%)', pointerEvents:'none' }} />

        {/* Floating coins */}
        {['💎','⭐','✨'].map((ch, i) => (
          <div key={i} style={{
            position:'absolute', top:`${15 + i * 25}%`, right:`${8 + i * 10}%`,
            fontSize: 22 + i * 6, opacity: 0.6, pointerEvents:'none',
            animation:`floatCreate ${6 + i}s ease-in-out ${i * 0.8}s infinite`,
          }}>{ch}</div>
        ))}

        <div className="relative z-10 p-7 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(245,183,49,0.15)', border:'1px solid rgba(245,183,49,0.35)' }}>
              <CreditCard className="w-4 h-4" style={{ color:'#F5B731' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(245,183,49,0.8)' }}>
              Subscription
            </span>
          </div>
          <h1 className="text-white font-black mb-1" style={{ fontSize:'clamp(22px,4vw,32px)', letterSpacing:'-0.02em' }}>
            Plans & Billing
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>
            Current plan: <span className="font-semibold capitalize" style={{ color:'rgba(255,255,255,0.75)' }}>{currentPlan}</span>
          </p>
        </div>
      </div>

      {/* ── Plan cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div key={plan.id} className="relative rounded-3xl overflow-hidden flex flex-col"
              style={{
                background: isCurrent ? PLAN_GRADIENTS[plan.id] : '#fff',
                border: plan.highlight && !isCurrent
                  ? '2px solid rgba(124,58,237,0.4)'
                  : isCurrent ? 'none' : '1.5px solid #E5E7EB',
                boxShadow: isCurrent ? '0 12px 40px rgba(16,24,40,0.25)' : '0 2px 12px rgba(16,24,40,0.06)',
              }}>

              {plan.highlight && !isCurrent && (
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-2xl"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-2xl"
                  style={{ background:'rgba(255,255,255,0.15)', color:'#fff' }}>
                  ✓ Active
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: isCurrent ? 'rgba(255,255,255,0.15)' : '#F4F3F9' }}>
                    {PLAN_ICONS[plan.id]}
                  </div>
                  <h3 className="text-lg font-black" style={{ color: isCurrent ? '#fff' : '#0b1220' }}>
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black" style={{ color: isCurrent ? '#fff' : '#0b1220' }}>
                      {plan.price}
                    </span>
                    <span className="text-sm" style={{ color: isCurrent ? 'rgba(255,255,255,0.55)' : '#9CA3AF' }}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: isCurrent ? 'rgba(255,255,255,0.7)' : '#7c3aed' }} />
                      <span style={{ color: isCurrent ? 'rgba(255,255,255,0.8)' : '#4B5563' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button disabled={isCurrent}
                  className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
                  style={isCurrent
                    ? { background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.5)', cursor:'default' }
                    : plan.highlight
                      ? { background:'linear-gradient(135deg,#7c3aed,#06b6d4)', color:'#fff', boxShadow:'0 6px 20px rgba(124,58,237,0.35)' }
                      : { background:'#0b1220', color:'#fff' }
                  }>
                  {isCurrent ? '✓ Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Payment Card ──────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6" style={{ background:'#fff', border:'1.5px solid #E5E7EB', boxShadow:'0 2px 12px rgba(16,24,40,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-[#0b1220]">Payment Card</h3>
          <CreditCard className="w-5 h-5" style={{ color:'#9CA3AF' }} />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="rounded-2xl p-6 text-white w-full sm:w-72 flex-shrink-0 relative overflow-hidden"
            style={{ background:'linear-gradient(135deg,#0f0e23,#1a1535)', boxShadow:'0 8px 28px rgba(16,24,40,0.3)' }}>
            <div style={{ position:'absolute', top:'-20%', right:'-10%', width:140, height:140, borderRadius:'50%',
              background:'radial-gradient(circle,rgba(124,58,237,0.5) 0%,transparent 70%)' }} />
            <div className="mb-8 relative z-10">
              <div className="text-xs mb-1" style={{ color:'rgba(255,255,255,0.5)' }}>Card Number</div>
              <div className="text-lg font-mono tracking-widest">•••• •••• •••• 4242</div>
            </div>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <div className="text-xs mb-1" style={{ color:'rgba(255,255,255,0.5)' }}>Card Holder</div>
                <div className="text-sm font-semibold tracking-wide">JOHN PARENT</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color:'rgba(255,255,255,0.5)' }}>Expires</div>
                <div className="text-sm font-semibold">12/28</div>
              </div>
            </div>
          </div>
          <button className="px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all"
            style={{ background:'#F4F3F9', color:'#4B5563', border:'1.5px solid #E5E7EB' }}>
            Update Card
          </button>
        </div>
      </div>

      {/* ── Invoices ──────────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden" style={{ background:'#fff', border:'1.5px solid #E5E7EB', boxShadow:'0 2px 12px rgba(16,24,40,0.06)' }}>
        <div className="px-6 py-4" style={{ borderBottom:'1px solid #E5E7EB' }}>
          <h3 className="text-lg font-black text-[#0b1220]">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background:'#F4F3F9', borderBottom:'1px solid #E5E7EB' }}>
              <tr>
                {['Invoice ID','Date','Amount','Status','Action'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                    style={{ color:'#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background:'#fff' }}>
              {invoices.map((invoice, i) => (
                <tr key={invoice.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid #F4F3F9' : 'none' }}
                  className="hover:bg-[#FAFAFE] transition-colors">
                  <td className="px-6 py-4 text-sm font-bold" style={{ color:'#0b1220' }}>#{invoice.id}</td>
                  <td className="px-6 py-4 text-sm" style={{ color:'#4B5563' }}>{invoice.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color:'#0b1220' }}>{invoice.amount}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background:'rgba(6,182,212,0.1)', color:'#0e7490' }}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background:'#F4F3F9' }}>
                      <Download className="w-4 h-4" style={{ color:'#7c3aed' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes floatCreate {
          0%,100% { transform: translateY(0px) rotate(-4deg); }
          50%      { transform: translateY(-16px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
