import React, { useState, useEffect } from 'react';
import { SectionSelection } from './components/SectionSelection';
import { ScheduleView } from './components/ScheduleView';
import { UpdateNotification } from './components/UpdateNotification';
import { Section } from './types';

const STORAGE_KEY = 'timetable_selected_section';
const DARK_MODE_KEY = 'timetable_dark_mode';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'schedule'>('home');
  const [selectedSection, setSelectedSection] = useState<Section>('A');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Default to true (dark mode) for better UX, but respect saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DARK_MODE_KEY);
      // If no preference saved, default to dark mode (true)
      // Only use light mode if explicitly saved as 'false'
      const shouldBeDark = saved !== 'false';
      
      // Clean up invalid localStorage values
      if (saved !== null && saved !== 'true' && saved !== 'false') {
        localStorage.setItem(DARK_MODE_KEY, 'true');
      }
      
      // Immediately sync HTML class with localStorage value
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        if (saved !== 'true') {
          localStorage.setItem(DARK_MODE_KEY, 'true');
        }
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(DARK_MODE_KEY, 'false');
      }
      
      return shouldBeDark;
    }
    return true; // Default to dark mode
  });

  // Load saved section from localStorage on mount
  useEffect(() => {
    const savedSection = localStorage.getItem(STORAGE_KEY) as Section | null;
    if (savedSection && ['A', 'B', 'C', 'D', 'E'].includes(savedSection)) {
      setSelectedSection(savedSection);
      setCurrentView('schedule');
    }
  }, []);

  // Apply dark mode class to document - runs on mount and when isDarkMode changes
  useEffect(() => {
    // Force remove first, then add if needed to ensure clean state
    const html = document.documentElement;
    html.classList.remove('dark');
    
    // Sync the HTML class with the React state
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem(DARK_MODE_KEY, 'true');
    } else {
      html.classList.remove('dark');
      localStorage.setItem(DARK_MODE_KEY, 'false');
    }
    
    // Force a reflow to ensure the class change is applied
    void html.offsetHeight;
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    // Use functional update to ensure we get the latest state
    setIsDarkMode(prev => {
      const newValue = !prev;
      
      // Immediately update DOM and localStorage for instant feedback
      const html = document.documentElement;
      
      // Remove dark class first to ensure clean state
      html.classList.remove('dark');
      
      if (newValue) {
        html.classList.add('dark');
        localStorage.setItem(DARK_MODE_KEY, 'true');
      } else {
        html.classList.remove('dark');
        localStorage.setItem(DARK_MODE_KEY, 'false');
      }
      
      // Force a reflow to ensure the change is applied
      void html.offsetHeight;
      
      return newValue;
    });
  };

  // Check for service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let updateCheckInterval: NodeJS.Timeout | null = null;
    let registration: ServiceWorkerRegistration | null = null;

    const handleControllerChange = () => {
      // Small delay to let user see the update notification if shown
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;

      // Check for updates every 60 seconds
      updateCheckInterval = setInterval(() => {
        reg.update();
      }, 60000);

      // Listen for service worker updates
      const handleUpdateFound = () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker is installed
                // With skipWaiting: true, it activates automatically
                // Show notification to inform user
                setUpdateAvailable(true);
                setUpdateDismissed(false);
              }
            }
          });
        }
      };

      reg.addEventListener('updatefound', handleUpdateFound);

      // Check immediately on load
      reg.update();
    });

    // Cleanup function
    return () => {
      if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleSectionSelect = (sec: Section) => {
    setSelectedSection(sec);
    // Save section to localStorage
    localStorage.setItem(STORAGE_KEY, sec);
    setCurrentView('schedule');
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  const handleUpdate = () => {
    // With skipWaiting: true, the service worker activates automatically
    // Just reload to get the new version
    window.location.reload();
  };

  const handleDismissUpdate = () => {
    setUpdateDismissed(true);
    setUpdateAvailable(false);
  };

  return (
    <main className="antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {currentView === 'home' ? (
        <SectionSelection 
          onSelect={handleSectionSelect} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      ) : (
        <ScheduleView 
          section={selectedSection} 
          onBack={handleBack}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}
      {updateAvailable && !updateDismissed && (
        <UpdateNotification 
          onUpdate={handleUpdate}
          onDismiss={handleDismissUpdate}
        />
      )}
    </main>
  );
}
