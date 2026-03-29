import { useState } from 'react';

interface OnboardingModalProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to Eisenhower Matrix',
    body: 'This app helps you prioritize tasks using the Eisenhower Matrix method — a simple 2×2 grid based on urgency and importance.',
  },
  {
    emoji: '📥',
    title: 'Start with the Inbox',
    body: 'Type any task into the Inbox. Every task starts here as a capture bucket. Don\'t overthink it — just get it out of your head!',
  },
  {
    emoji: '🎯',
    title: 'Drag to prioritize',
    body: 'Drag tasks from the Inbox into one of four quadrants:\n🔴 Do First (urgent + important)\n🟢 Schedule (not urgent + important)\n🟡 Delegate (urgent + not important)\n🔵 Eliminate (not urgent + not important)',
  },
  {
    emoji: '🔢',
    title: 'Tasks become numbers',
    body: 'Once in a quadrant, a task shows as a colored number badge. Hover over it (or tap on mobile) to see the full task name. Click to open the full detail view.',
  },
  {
    emoji: '🔄',
    title: 'Sync across browsers',
    body: 'Want to see your tasks on another device or browser? Go to Settings → Sync, copy your sync token, and paste it on the other browser. They\'ll sync in real-time!',
  },
];

export function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div role="dialog" aria-modal="true" aria-label="Welcome tutorial"
           className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm
                        border border-slate-200 dark:border-slate-700 animate-scale-in overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-6 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">{current.emoji}</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              {current.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {current.body}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 px-6 pb-6">
            <button
              onClick={onDismiss}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Skip intro
            </button>

            <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={isLast ? onDismiss : () => setStep(step + 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white
                         hover:bg-blue-700 transition-colors"
            >
              {isLast ? 'Get started!' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
