import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Bell, Volume2, Moon, Shield, Download } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [nightMode, setNightMode] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState('high');

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
