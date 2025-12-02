import React, { useState } from 'react';
import { SectionSelection } from './components/SectionSelection';
import { ScheduleView } from './components/ScheduleView';
import { Section } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'schedule'>('home');
  const [selectedSection, setSelectedSection] = useState<Section>('A');

  const handleSectionSelect = (sec: Section) => {
    setSelectedSection(sec);
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
