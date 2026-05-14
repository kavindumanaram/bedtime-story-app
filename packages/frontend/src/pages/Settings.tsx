import React, { useState } from 'react';
import { Bell, Volume2, Moon, Shield, Download, FlaskConical, RotateCcw, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useDevSettings, DEV_SETTINGS_DEFAULTS, resetDevSettings } from '../lib/devSettings';

const IMAGES_OPTIONS = [1, 3, 5, 8] as const;
const IMAGE_MODEL_OPTIONS = [
  { label: "gpt-image-1-mini (fast, cheap)", value: "gpt-image-1-mini" },
  { label: "gpt-image-1 (higher quality)", value: "gpt-image-1" },
  { label: "dall-e-3 (legacy)", value: "dall-e-3" },
] as const;
const TIMEOUT_OPTIONS = [
  { label: "5 s",  value: 5_000  },
  { label: "15 s", value: 15_000 },
  { label: "30 s", value: 30_000 },
  { label: "60 s", value: 60_000 },
] as const;

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
    style={{ background: checked ? '#10b981' : '#D1D5DB' }}
  >
    <span
      className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
      style={{ transform: checked ? 'translateX(24px)' : 'translateX(4px)' }}
    />
  </button>
);

const SectionCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div
    className="rounded-3xl overflow-hidden"
    style={{ background: '#fff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(16,24,40,0.06)', ...style }}
  >
    {children}
  </div>
);

const SectionHeader = ({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid #F4F3F9' }}>
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: iconBg }}>
      <span style={{ color: iconColor }}>{icon}</span>
    </div>
    <div>
      <h3 className="font-black text-[#0b1220]" style={{ fontSize: 15 }}>{title}</h3>
      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{description}</p>
    </div>
  </div>
);

const SettingRow = ({ label, sublabel, right }: { label: string; sublabel?: string; right: React.ReactNode }) => (
  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F9FAFB' }}>
    <div>
      <p className="text-sm font-semibold" style={{ color: '#374151' }}>{label}</p>
      {sublabel && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sublabel}</p>}
    </div>
    {right}
  </div>
);

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [nightMode, setNightMode] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState('high');
  const [devSettings, updateDevSettings] = useDevSettings();

  return (
    <div className="space-y-5">

      {/* ── Dark hero header ─────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', minHeight: 160 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(16,185,129,0.25) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '5%', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(124,58,237,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {['⚙️','🌙','🔔'].map((ch, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${15 + i * 25}%`, right: `${8 + i * 10}%`,
            fontSize: 20 + i * 5, opacity: 0.5, pointerEvents: 'none',
            animation: `floatSettings ${6 + i}s ease-in-out ${i * 0.8}s infinite`,
          }}>{ch}</div>
        ))}

        <div className="relative z-10 p-7 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)' }}>
              <Moon className="w-4 h-4" style={{ color: '#10b981' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.8)' }}>
              Preferences
            </span>
          </div>
          <h1 className="text-white font-black mb-1" style={{ fontSize: 'clamp(22px,4vw,30px)', letterSpacing: '-0.02em' }}>
            Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            Customize your HushTales experience
          </p>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          icon={<Bell className="w-5 h-5" />}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
          title="Notifications"
          description="Updates about new stories and bedtime reminders"
        />
        <SettingRow
          label="Push Notifications"
          sublabel="Get notified about new stories"
          right={<Toggle checked={notifications} onChange={setNotifications} />}
        />
        <SettingRow
          label="Email Updates"
          sublabel="Weekly story recommendations"
          right={<Toggle checked={true} onChange={() => {}} />}
        />
      </SectionCard>

      {/* ── Playback ─────────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          icon={<Volume2 className="w-5 h-5" />}
          iconBg="rgba(59,130,246,0.1)"
          iconColor="#3b82f6"
          title="Playback"
          description="Control how stories play and sound"
        />
        <SettingRow
          label="Autoplay Next Story"
          sublabel="Automatically play the next story"
          right={<Toggle checked={autoplay} onChange={setAutoplay} />}
        />
        <div className="px-6 py-4">
          <p className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>Default Playback Speed</p>
          <select className="w-full px-3 py-2.5 rounded-2xl text-sm border focus:outline-none focus:ring-2"
            style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#374151' }}>
            <option value="0.8">0.8× — Slower</option>
            <option value="1">1× — Normal</option>
            <option value="1.2">1.2× — Faster</option>
          </select>
        </div>
      </SectionCard>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          icon={<Moon className="w-5 h-5" />}
          iconBg="rgba(124,58,237,0.1)"
          iconColor="#7c3aed"
          title="Appearance"
          description="Customize the look and feel of the app"
        />
        <SettingRow
          label="Auto Night Mode"
          sublabel="Switch to dark mode after 7 PM"
          right={<Toggle checked={nightMode} onChange={setNightMode} />}
        />
        <div className="px-6 py-4">
          <p className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'auto'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="py-2.5 rounded-2xl text-sm font-bold transition-all capitalize"
                style={theme === t
                  ? { background: '#0b1220', color: '#fff', boxShadow: '0 4px 14px rgba(11,18,32,0.25)' }
                  : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── Downloads ────────────────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          icon={<Download className="w-5 h-5" />}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#f59e0b"
          title="Downloads"
          description="Manage offline story downloads"
        />
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #F9FAFB' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>Download Quality</p>
          <select
            value={downloadQuality}
            onChange={(e) => setDownloadQuality(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#374151' }}
          >
            <option value="standard">Standard — smaller files</option>
            <option value="high">High Quality</option>
            <option value="ultra">Ultra HD — larger files</option>
          </select>
        </div>
        <SettingRow
          label="WiFi Only"
          sublabel="Download only on WiFi to save mobile data"
          right={<Toggle checked={true} onChange={() => {}} />}
        />
        <div className="px-6 py-4">
          <button className="text-sm font-semibold transition-colors"
            style={{ color: '#ef4444' }}>
            Clear All Downloads (2.3 GB)
          </button>
        </div>
      </SectionCard>

      {/* ── Developer Controls ───────────────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: '#fff', border: '1.5px solid rgba(245,158,11,0.35)', boxShadow: '0 2px 12px rgba(16,24,40,0.06)' }}
      >
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid #FEF3C7', background: 'rgba(245,158,11,0.04)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)' }}>
            <FlaskConical className="w-5 h-5" style={{ color: '#D97706' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-[#0b1220]" style={{ fontSize: 15 }}>Developer Controls</h3>
            <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>Testing and tuning — changes take effect on the next story</p>
          </div>
          <button
            onClick={() => { resetDevSettings(); updateDevSettings({ ...DEV_SETTINGS_DEFAULTS }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#D97706' }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Images per story */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #F9FAFB' }}>
          <p className="text-sm font-semibold text-[#374151] mb-0.5">Images per Story</p>
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Number of scene images generated for each new story.</p>
          <div className="flex gap-2">
            {IMAGES_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => updateDevSettings({ imagesPerStory: n })}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={devSettings.imagesPerStory === n
                  ? { background: '#0b1220', color: '#fff', boxShadow: '0 4px 14px rgba(11,18,32,0.2)' }
                  : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        {[
          { key: 'progressiveGeneration' as const,     label: 'Progressive Generation',      sub: 'Show images as they generate rather than waiting for all.' },
          { key: 'cinematicIntroEnabled' as const,     label: 'Cinematic Intro',              sub: 'Preparation + movie-style intro sequence before playback.' },
          { key: 'autoplayEnabled' as const,           label: 'Autoplay Narration',           sub: 'Start narrating automatically and advance through pages.' },
          { key: 'generateReferenceImage' as const,    label: 'Character Reference Image',    sub: 'Generate a character sheet before scene images. Adds cost and latency.' },
          { key: 'useStaticImage' as const,            label: 'Static Image Mode',            sub: 'Skip all API image generation — use a local fallback. Zero cost, instant load.' },
        ].map(({ key, label, sub }) => (
          <SettingRow
            key={key}
            label={label}
            sublabel={sub}
            right={
              <Toggle
                checked={devSettings[key] as boolean}
                onChange={(v) => updateDevSettings({ [key]: v })}
              />
            }
          />
        ))}

        {/* Image model */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #F9FAFB' }}>
          <p className="text-sm font-semibold text-[#374151] mb-0.5">Image Model</p>
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>OpenAI model used for scene and cover image generation.</p>
          <select
            value={devSettings.imageModel}
            onChange={(e) => updateDevSettings({ imageModel: e.target.value })}
            className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#374151' }}
          >
            {IMAGE_MODEL_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Image generation timeout */}
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-[#374151] mb-0.5">Image Generation Timeout</p>
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Max time to wait for each scene image before using a fallback.</p>
          <div className="flex gap-2">
            {TIMEOUT_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => updateDevSettings({ imageGenerationTimeoutMs: value })}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={devSettings.imageGenerationTimeoutMs === value
                  ? { background: '#0b1220', color: '#fff', boxShadow: '0 4px 14px rgba(11,18,32,0.2)' }
                  : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Privacy & Security ───────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          icon={<Shield className="w-5 h-5" />}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
          title="Privacy & Security"
          description="Control your data and privacy settings"
        />
        {['Privacy Policy', 'Terms of Service', 'Data Management'].map((item, i, arr) => (
          <button
            key={item}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors hover:bg-[#FAFAFE]"
            style={{
              color: '#374151',
              borderBottom: i < arr.length - 1 ? '1px solid #F9FAFB' : 'none',
            }}
          >
            {item}
            <ChevronRight className="w-4 h-4" style={{ color: '#D1D5DB' }} />
          </button>
        ))}
      </SectionCard>

      <style>{`
        @keyframes floatSettings {
          0%,100% { transform: translateY(0px) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
