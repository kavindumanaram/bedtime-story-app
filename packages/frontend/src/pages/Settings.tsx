import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Bell, Volume2, Moon, Shield, Download, FlaskConical, RotateCcw } from 'lucide-react';
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

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [nightMode, setNightMode] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState('high');
  const [devSettings, updateDevSettings] = useDevSettings();

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-primary' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Customize your HushTales experience</p>
      </div>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">
              Receive updates about new stories and bedtime reminders
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Get notified about new stories</p>
                </div>
                <Toggle checked={notifications} onChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Updates</p>
                  <p className="text-xs text-gray-500">Weekly story recommendations</p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Playback */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Playback Settings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Control how stories play and sound
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Autoplay Next Story</p>
                  <p className="text-xs text-gray-500">Automatically play the next story</p>
                </div>
                <Toggle checked={autoplay} onChange={setAutoplay} />
              </div>
              <div className="py-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Default Playback Speed
                </label>
                <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="0.8">0.8x (Slower)</option>
                  <option value="1">1x (Normal)</option>
                  <option value="1.2">1.2x (Faster)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Appearance</h3>
            <p className="text-sm text-gray-600 mb-4">
              Customize the look and feel of the app
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto Night Mode</p>
                  <p className="text-xs text-gray-500">Switch to night mode after 7 PM</p>
                </div>
                <Toggle checked={nightMode} onChange={setNightMode} />
              </div>
              <div className="py-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'auto'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                        ${theme === t
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Downloads */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Downloads</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage offline story downloads
            </p>
            <div className="space-y-3">
              <div className="py-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Download Quality
                </label>
                <select 
                  value={downloadQuality}
                  onChange={(e) => setDownloadQuality(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="standard">Standard (smaller files)</option>
                  <option value="high">High Quality</option>
                  <option value="ultra">Ultra HD (larger files)</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Download over WiFi only</p>
                  <p className="text-xs text-gray-500">Save mobile data</p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
              <div className="pt-2">
                <button className="text-sm text-primary hover:text-primary-dark font-medium">
                  Clear All Downloads (2.3 GB)
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Developer Controls */}
      <Card className="p-6 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Developer Controls</h3>
              <button
                onClick={() => {
                  resetDevSettings();
                  updateDevSettings({ ...DEV_SETTINGS_DEFAULTS });
                }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-5">
              Testing and tuning controls — changes take effect on the next story.
            </p>
            <div className="space-y-5">

              {/* Images per story */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Images per Story</p>
                <p className="text-xs text-gray-500 mb-3">Number of scene images generated for each new story.</p>
                <div className="flex gap-2">
                  {IMAGES_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => updateDevSettings({ imagesPerStory: n })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        devSettings.imagesPerStory === n
                          ? 'bg-primary text-white border-primary'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progressive generation */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Progressive Generation</p>
                  <p className="text-xs text-gray-500">Show images as they generate rather than waiting for all.</p>
                </div>
                <Toggle
                  checked={devSettings.progressiveGeneration}
                  onChange={(v) => updateDevSettings({ progressiveGeneration: v })}
                />
              </div>

              {/* Cinematic intro */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Cinematic Intro</p>
                  <p className="text-xs text-gray-500">Preparation + movie-style intro sequence before playback.</p>
                </div>
                <Toggle
                  checked={devSettings.cinematicIntroEnabled}
                  onChange={(v) => updateDevSettings({ cinematicIntroEnabled: v })}
                />
              </div>

              {/* Autoplay */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Autoplay Narration</p>
                  <p className="text-xs text-gray-500">Start narrating automatically and advance through pages.</p>
                </div>
                <Toggle
                  checked={devSettings.autoplayEnabled}
                  onChange={(v) => updateDevSettings({ autoplayEnabled: v })}
                />
              </div>

              {/* Reference image */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Character Reference Image</p>
                  <p className="text-xs text-gray-500">Generate a character sheet before scene images. Adds cost and latency; leave off unless testing consistency.</p>
                </div>
                <Toggle
                  checked={devSettings.generateReferenceImage}
                  onChange={(v) => updateDevSettings({ generateReferenceImage: v })}
                />
              </div>

              {/* Static image mode */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Static Image Mode</p>
                  <p className="text-xs text-gray-500">Skip all API image generation — use a local fallback for every scene. Zero cost, instant load.</p>
                </div>
                <Toggle
                  checked={devSettings.useStaticImage}
                  onChange={(v) => updateDevSettings({ useStaticImage: v })}
                />
              </div>

              {/* Image model */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Image Model</p>
                <p className="text-xs text-gray-500 mb-3">OpenAI model used for scene and cover image generation.</p>
                <select
                  value={devSettings.imageModel}
                  onChange={(e) => updateDevSettings({ imageModel: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {IMAGE_MODEL_OPTIONS.map(({ label, value }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Image generation timeout */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Image Generation Timeout</p>
                <p className="text-xs text-gray-500 mb-3">Max time to wait for each scene image before using a fallback.</p>
                <div className="flex gap-2">
                  {TIMEOUT_OPTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => updateDevSettings({ imageGenerationTimeoutMs: value })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        devSettings.imageGenerationTimeoutMs === value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Privacy & Security</h3>
            <p className="text-sm text-gray-600 mb-4">
              Control your data and privacy settings
            </p>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors">
                Privacy Policy
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors">
                Terms of Service
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors">
                Data Management
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
