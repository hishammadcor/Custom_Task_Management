import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/common/ThemeProvider';
import { AppLayout } from './components/layout/AppLayout';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

const ONBOARDING_KEY = 'eim-onboarding-seen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding only if the user has never seen it
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  };

  return (
    <ThemeProvider>
      <AppLayout />
      {showOnboarding && <OnboardingModal onDismiss={handleDismissOnboarding} />}
    </ThemeProvider>
  );
}
