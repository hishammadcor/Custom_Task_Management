import { useRef, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTaskStore } from '../../store/taskStore';
import { QUADRANT_CONFIG, DEFAULT_QUADRANT_COLORS } from '../../utils/colors';
import { exportToJSON, exportToCSV, importFromJSON } from '../../utils/exportImport';
import type { QuadrantId } from '../../types';
import { isFirebaseConfigured } from '../../services/firebase';

interface SettingsPanelProps {
  onClose: () => void;
}

type TabId = 'appearance' | 'sync' | 'data';

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings, generateNewSyncToken, resetColors } = useSettingsStore();
  const { tasks, importTasks, clearAll } = useTaskStore();
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [copyTokenMsg, setCopyTokenMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firebaseReady = isFirebaseConfigured();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess('');
    try {
      const imported = await importFromJSON(file);
      importTasks(imported);
      setImportSuccess(`Imported ${imported.length} tasks successfully.`);
    } catch (err) {
      setImportError((err as Error).message);
    }
    e.target.value = '';
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(settings.syncToken);
      setCopyTokenMsg('Copied!');
      setTimeout(() => setCopyTokenMsg(''), 2000);
    } catch {
      setCopyTokenMsg('Copy failed');
    }
  };

  const tabClass = (id: TabId) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
    ${activeTab === id
      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in"
           onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div role="dialog" aria-modal="true" aria-label="Settings"
           className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] flex flex-col
                      bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4
                        border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
          <button onClick={onClose} aria-label="Close settings"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                             hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-slate-200 dark:border-slate-700 px-4">
          <button className={tabClass('appearance')} onClick={() => setActiveTab('appearance')}>Appearance</button>
          <button className={tabClass('sync')} onClick={() => setActiveTab('sync')}>Sync</button>
          <button className={tabClass('data')} onClick={() => setActiveTab('data')}>Data</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ── APPEARANCE TAB ── */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme */}
              <SettingGroup label="Theme">
                <RadioGroup
                  value={settings.theme}
                  onChange={(v) => updateSettings({ theme: v as 'light' | 'dark' | 'system' })}
                  options={[
                    { value: 'light', label: '☀️ Light' },
                    { value: 'dark', label: '🌙 Dark' },
                    { value: 'system', label: '💻 System' },
                  ]}
                />
              </SettingGroup>

              {/* View Mode */}
              <SettingGroup label="View density">
                <RadioGroup
                  value={settings.viewMode}
                  onChange={(v) => updateSettings({ viewMode: v as 'compact' | 'comfortable' | 'spacious' })}
                  options={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'spacious', label: 'Spacious' },
                  ]}
                />
              </SettingGroup>

              {/* Font Size */}
              <SettingGroup label="Font size">
                <RadioGroup
                  value={settings.fontSize}
                  onChange={(v) => updateSettings({ fontSize: v as 'small' | 'medium' | 'large' })}
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </SettingGroup>

              {/* Task numbering */}
              <SettingGroup label="Task numbering">
                <RadioGroup
                  value={settings.taskNumbering}
                  onChange={(v) => updateSettings({ taskNumbering: v as 'sequential' | 'by-quadrant' })}
                  options={[
                    { value: 'sequential', label: 'Sequential (1, 2, 3…)' },
                    { value: 'by-quadrant', label: 'By quadrant (Q1-1, Q2-1…)' },
                  ]}
                />
              </SettingGroup>

              {/* Toggles */}
              <SettingGroup label="Display options">
                <div className="space-y-3">
                  <Toggle
                    label="High contrast mode"
                    checked={settings.highContrast}
                    onChange={(v) => updateSettings({ highContrast: v })}
                  />
                  <Toggle
                    label="Show completed tasks"
                    checked={settings.showCompleted}
                    onChange={(v) => updateSettings({ showCompleted: v })}
                  />
                </div>
              </SettingGroup>

              {/* Quadrant colors */}
              <SettingGroup label="Quadrant colors">
                <div className="space-y-3">
                  {(['q1', 'q2', 'q3', 'q4'] as Exclude<QuadrantId, 'inbox'>[]).map((qId) => (
                    <div key={qId} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {QUADRANT_CONFIG[qId].name}
                        </p>
                        <p className="text-xs text-slate-400">{QUADRANT_CONFIG[qId].subtitle}</p>
                      </div>
                      <input
                        type="color"
                        value={settings.quadrantColors[qId]}
                        onChange={(e) =>
                          updateSettings({
                            quadrantColors: { ...settings.quadrantColors, [qId]: e.target.value },
                          })
                        }
                        className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600
                                   cursor-pointer p-0.5 bg-transparent"
                        aria-label={`${QUADRANT_CONFIG[qId].name} color`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={resetColors}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  >
                    Reset to defaults
                  </button>
                </div>
              </SettingGroup>
            </>
          )}

          {/* ── SYNC TAB ── */}
          {activeTab === 'sync' && (
            <>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">How sync works</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 leading-relaxed">
                  Each browser gets a unique <strong>sync token</strong>. Share it with another browser or device
                  — they'll see your tasks in real-time. No sign-in required.
                  Requires Firebase to be configured (see <code>.env.example</code>).
                </p>
              </div>

              {!firebaseReady && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ Firebase is not configured. Sync is unavailable.
                    See <code className="text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.example</code> for setup instructions.
                  </p>
                </div>
              )}

              <SettingGroup label="Cloud sync">
                <Toggle
                  label="Enable real-time sync"
                  checked={settings.syncEnabled && firebaseReady}
                  onChange={(v) => updateSettings({ syncEnabled: v })}
                  disabled={!firebaseReady}
                />
              </SettingGroup>

              {firebaseReady && (
                <>
                  <SettingGroup label="Your sync token">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 min-w-0 text-xs font-mono px-3 py-2 rounded-lg
                                       bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
                                       border border-slate-200 dark:border-slate-700 truncate">
                        {settings.syncToken}
                      </code>
                      <button
                        onClick={copyToken}
                        className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium
                                   bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                                   hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Copy sync token"
                      >
                        {copyTokenMsg || 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Share this token with another browser to sync your data.
                    </p>
                  </SettingGroup>

                  <SettingGroup label="Connect to existing sync">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem('token') as HTMLInputElement).value.trim();
                        if (input) { updateSettings({ syncToken: input, syncEnabled: true }); }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        name="token"
                        type="text"
                        placeholder="Paste sync token…"
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600
                                   bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                                   placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Enter sync token from another device"
                      />
                      <button type="submit"
                              className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium
                                         bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        Connect
                      </button>
                    </form>
                  </SettingGroup>

                  <SettingGroup label="Generate new token">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Creates a new private sync room. Your existing tasks won't be lost.
                    </p>
                    <button
                      onClick={() => { if (window.confirm('Generate a new sync token? Other browsers using the current token will no longer sync.')) { generateNewSyncToken(); } }}
                      className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600
                                 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Generate new token
                    </button>
                  </SettingGroup>

                  <SettingGroup label="Sync interval">
                    <RadioGroup
                      value={String(settings.syncInterval)}
                      onChange={(v) => updateSettings({ syncInterval: parseInt(v) as 5 | 15 | 60 | 300 })}
                      options={[
                        { value: '5', label: '5 sec' },
                        { value: '15', label: '15 sec' },
                        { value: '60', label: '1 min' },
                        { value: '300', label: '5 min' },
                      ]}
                    />
                  </SettingGroup>
                </>
              )}
            </>
          )}

          {/* ── DATA TAB ── */}
          {activeTab === 'data' && (
            <>
              <SettingGroup label="Export tasks">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => exportToJSON(tasks)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                               border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                               hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    Export JSON
                  </button>
                  <button
                    onClick={() => exportToCSV(tasks)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                               border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                               hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25l.01 9.5A2.25 2.25 0 0116.76 17H3.26A2.267 2.267 0 011 14.74l-.01-9.5zm8.26 9.52v-.001a.75.75 0 001.5 0v-.001l-.01-7.09 1.53 1.49a.75.75 0 001.04-1.08l-2.776-2.7a.75.75 0 00-1.04 0L7.252 7.29a.75.75 0 101.04 1.08l1.528-1.488.01 7.88z" clipRule="evenodd" />
                    </svg>
                    Export CSV
                  </button>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} will be exported
                </p>
              </SettingGroup>

              <SettingGroup label="Import tasks">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  aria-label="Import JSON file"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                             border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                             hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Import from JSON…
                </button>
                {importError && <p className="text-xs text-red-600 mt-1">{importError}</p>}
                {importSuccess && <p className="text-xs text-emerald-600 mt-1">{importSuccess}</p>}
              </SettingGroup>

              <SettingGroup label="Clear all data">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Permanently deletes all tasks. This cannot be undone.
                </p>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">Are you sure?</span>
                    <button
                      onClick={() => { clearAll(); setShowClearConfirm(false); }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                    >
                      Delete everything
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700
                                 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400
                               border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Clear all tasks…
                  </button>
                )}
              </SettingGroup>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Internal helper components ──────────────────────────────────────────────

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
        {label}
      </h3>
      {children}
    </div>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${value === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-4 cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transform transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
          aria-hidden="true"
        />
      </button>
    </label>
  );
}
