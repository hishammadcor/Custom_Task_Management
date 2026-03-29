import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { QUADRANT_CONFIG } from '../../utils/colors';
import type { QuadrantId } from '../../types';

const QUADRANT_IDS: Exclude<QuadrantId, 'inbox'>[] = ['q1', 'q2', 'q3', 'q4'];

interface AnalyticsDashboardProps {
  onClose: () => void;
}

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const { tasks } = useTaskStore();
  const { settings } = useSettingsStore();

  const stats = useMemo(() => {
    const active = tasks.filter((t) => !t.archived);
    const total = active.length;
    const completed = active.filter((t) => t.completed).length;
    const inbox = active.filter((t) => t.quadrant === 'inbox').length;

    const byQuadrant = QUADRANT_IDS.map((qId) => {
      const qTasks = active.filter((t) => t.quadrant === qId);
      return {
        id: qId,
        name: QUADRANT_CONFIG[qId].name,
        total: qTasks.length,
        done: qTasks.filter((t) => t.completed).length,
        color: settings.quadrantColors[qId],
      };
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgEstimate = (() => {
      const estimated = active.filter((t) => t.timeEstimate);
      return estimated.length > 0
        ? Math.round(estimated.reduce((s, t) => s + (t.timeEstimate ?? 0), 0) / estimated.length)
        : 0;
    })();

    return { total, completed, inbox, completionRate, byQuadrant, avgEstimate };
  }, [tasks, settings.quadrantColors]);

  const pieData = stats.byQuadrant.filter((q) => q.total > 0);
  const barData = stats.byQuadrant.map((q) => ({
    name: q.name,
    Total: q.total,
    Done: q.done,
    fill: q.color,
  }));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in"
           onClick={onClose} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-label="Analytics"
           className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] flex flex-col
                      bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4
                        border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            📊 Analytics
          </h2>
          <button onClick={onClose} aria-label="Close analytics"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                             hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total tasks', value: stats.total, color: 'text-slate-700 dark:text-slate-200' },
              { label: 'Completed', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'In inbox', value: stats.inbox, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Completion', value: `${stats.completionRate}%`, color: 'text-purple-600 dark:text-purple-400' },
            ].map((s) => (
              <div key={s.label}
                   className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Task distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="total"
                       nameKey="name" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                       labelLine={false}>
                    {pieData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => [`${value} tasks`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar chart */}
          {stats.byQuadrant.some((q) => q.total > 0) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Tasks per quadrant</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Total" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                  <Bar dataKey="Done" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quadrant breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Quadrant breakdown</h3>
            <div className="space-y-2">
              {stats.byQuadrant.map((q) => (
                <div key={q.id} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: q.color }} />
                  <span className="text-sm text-slate-700 dark:text-slate-300 w-28 flex-shrink-0">{q.name}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: stats.total > 0 ? `${(q.total / stats.total) * 100}%` : '0%',
                        backgroundColor: q.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right flex-shrink-0">
                    {q.done}/{q.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {stats.avgEstimate > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Average time estimate per task: <strong>{stats.avgEstimate} min</strong>
            </p>
          )}

          {stats.total === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-400">No tasks yet. Add some to see analytics!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
