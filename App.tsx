import React, { useState, useEffect } from 'react';
import { SectionSelection } from './components/SectionSelection';
import { ScheduleView } from './components/ScheduleView';
import { Section } from './types';

const STORAGE_KEY = 'timetable_selected_section';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'schedule'>('home');
  const [selectedSection, setSelectedSection] = useState<Section>('A');

  // Load saved section from localStorage on mount
  useEffect(() => {
    const savedSection = localStorage.getItem(STORAGE_KEY) as Section | null;
    if (savedSection && ['A', 'B', 'C', 'D', 'E'].includes(savedSection)) {
      setSelectedSection(savedSection);
      setCurrentView('schedule');
    }
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

  return (
    <main className="antialiased text-gray-900">
      {currentView === 'home' ? (
        <SectionSelection onSelect={handleSectionSelect} />
      ) : (
        <ScheduleView 
          section={selectedSection} 
          onBack={handleBack} 
        />
      )}
    </main>
  );
}
