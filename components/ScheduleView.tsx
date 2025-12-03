import React, { useState, useEffect, useMemo } from 'react';
import { Section, DaySchedule } from '../types';
import { fetchTimetable } from '../services/sheetService';
import { DateSelector } from './DateSelector';
import { ClassCard } from './ClassCard';
import { ChevronLeft, Moon, Sun, Loader2, CalendarX, AlertTriangle } from 'lucide-react';

interface ScheduleViewProps {
  section: Section;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

// Generate a static range of dates for the semester (Oct 2025 - Mar 2026)
const generateSemesterDates = () => {
  const dates: Date[] = [];
  const start = new Date(2025, 9, 1); // Oct 1, 2025
  const end = new Date(2026, 2, 31);  // Mar 31, 2026 (Month is 0-indexed)
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// Helper function to get today's date if it's within the semester range, otherwise return the first date
const getInitialDate = (allDates: Date[]): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for comparison
  
  // Check if today is within the semester date range
  const todayInRange = allDates.find(date => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly.getTime() === today.getTime();
  });
  
  // Return today if it's in range, otherwise return the first date
  return todayInRange || allDates[0] || new Date("December 2, 2025");
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ section, onBack, isDarkMode, onToggleDarkMode }) => {
  const [timetableData, setTimetableData] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize the calendar days so we don't regenerate them on every render
  const allDates = useMemo(() => generateSemesterDates(), []);
  
  // Initialize with today's date (if in range) or first available date
  const [currentDate, setCurrentDate] = useState(() => getInitialDate(allDates));
  
  // Reset to today's date when section changes
  useEffect(() => {
    const todayDate = getInitialDate(allDates);
    setCurrentDate(todayDate);
  }, [section, allDates]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTimetable(section);
        setTimetableData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [section]);

  const selectedDayClasses = useMemo(() => {
    const match = timetableData.find(d => 
      d.dateObj.getDate() === currentDate.getDate() && 
      d.dateObj.getMonth() === currentDate.getMonth() &&
      d.dateObj.getFullYear() === currentDate.getFullYear()
    );
    return match ? match.slots : [];
  }, [timetableData, currentDate]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-4 pb-2 sticky top-0 z-30 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">Section {section}</h2>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">{monthName}</span>
          </div>
          
          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-300 active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Date Picker (Scrollable) */}
      <DateSelector 
        currentDate={currentDate} 
        onSelectDate={setCurrentDate} 
        days={allDates}
        isDarkMode={isDarkMode}
      />

      {/* Content Area */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 animate-pulse">
            <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">Syncing timetable...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 transition-colors duration-300">
            <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400 mb-3" />
            <p className="text-red-900 dark:text-red-200 font-semibold mb-1 transition-colors duration-300">Sync Error</p>
            <p className="text-red-700 dark:text-red-300 text-sm transition-colors duration-300">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-700 shadow-sm transition-colors duration-300"
            >
                Retry
            </button>
          </div>
        ) : selectedDayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
               <CalendarX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-1 transition-colors duration-300">No Classes Scheduled</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto transition-colors duration-300">
              There are no classes listed for {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}. Enjoy your free time!
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedDayClasses.map((slot, idx) => (
               <ClassCard key={`${slot.time}-${idx}`} slot={slot} isDarkMode={isDarkMode} />
             ))}
             
             <div className="pt-8 pb-12 flex justify-center">
                <p className="text-xs text-gray-300 dark:text-gray-600 font-medium uppercase tracking-widest transition-colors duration-300">End of Schedule</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};