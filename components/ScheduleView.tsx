import React, { useState, useEffect, useMemo } from 'react';
import { Section, DaySchedule } from '../types';
import { fetchTimetable } from '../services/sheetService';
import { DateSelector } from './DateSelector';
import { ClassCard } from './ClassCard';
import { ChevronLeft, BarChart2, Loader2, CalendarX, AlertTriangle } from 'lucide-react';

interface ScheduleViewProps {
  section: Section;
  onBack: () => void;
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

export const ScheduleView: React.FC<ScheduleViewProps> = ({ section, onBack }) => {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2 sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Section {section}</h2>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{monthName}</span>
          </div>
          
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-sm">
             <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Date Picker (Scrollable) */}
      <DateSelector 
        currentDate={currentDate} 
        onSelectDate={setCurrentDate} 
        days={allDates} 
      />

      {/* Content Area */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 animate-pulse">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Syncing timetable...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-red-50 rounded-2xl border border-red-100">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-red-900 font-semibold mb-1">Sync Error</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 shadow-sm"
            >
                Retry
            </button>
          </div>
        ) : selectedDayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
               <CalendarX className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-1">No Classes Scheduled</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              There are no classes listed for {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}. Enjoy your free time!
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedDayClasses.map((slot, idx) => (
               <ClassCard key={`${slot.time}-${idx}`} slot={slot} />
             ))}
             
             <div className="pt-8 pb-12 flex justify-center">
                <p className="text-xs text-gray-300 font-medium uppercase tracking-widest">End of Schedule</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};