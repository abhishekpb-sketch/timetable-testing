import React, { useState, useEffect, useMemo } from 'react';
import { Section, DaySchedule } from '../types';
import { fetchTimetable } from '../services/sheetService';
import { DateSelector } from './DateSelector';
import { ClassCard } from './ClassCard';
import { ChevronLeft, Moon, Sun, Loader2, CalendarX, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { 
  requestNotificationPermission, 
  scheduleAlarm, 
  cancelAllAlarms,
  cancelAlarm,
  parseTimeString, 
  calculateAlarmTime,
  generateAlarmId,
  AlarmInfo
} from '../services/alarmService';

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

const ALARM_STORAGE_KEY = 'timetable_alarms';
const MASTER_ALARM_KEY = 'timetable_master_alarm';

export const ScheduleView: React.FC<ScheduleViewProps> = ({ section, onBack, isDarkMode, onToggleDarkMode }) => {
  const [timetableData, setTimetableData] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize the calendar days so we don't regenerate them on every render
  const allDates = useMemo(() => generateSemesterDates(), []);
  
  // Initialize with today's date (if in range) or first available date
  const [currentDate, setCurrentDate] = useState(() => getInitialDate(allDates));
  
  // Alarm state management
  const [masterAlarmEnabled, setMasterAlarmEnabled] = useState(() => {
    const saved = localStorage.getItem(MASTER_ALARM_KEY);
    return saved === 'true';
  });
  
  const [enabledAlarms, setEnabledAlarms] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(ALARM_STORAGE_KEY);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  
  // Reset to today's date when section changes
  useEffect(() => {
    const todayDate = getInitialDate(allDates);
    setCurrentDate(todayDate);
  }, [section, allDates]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Save enabled alarms to localStorage
  useEffect(() => {
    localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(Array.from(enabledAlarms)));
  }, [enabledAlarms]);

  // Save master alarm state
  useEffect(() => {
    localStorage.setItem(MASTER_ALARM_KEY, String(masterAlarmEnabled));
  }, [masterAlarmEnabled]);

  // Schedule alarms when enabled alarms or master alarm changes
  useEffect(() => {
    const setupAlarms = async () => {
      // Cancel all existing alarms
      await cancelAllAlarms();

      if (!masterAlarmEnabled && enabledAlarms.size === 0) {
        return;
      }

      const alarmsToSchedule: AlarmInfo[] = [];
      
      selectedDayClasses.forEach((slot) => {
        const alarmId = generateAlarmId(currentDate, slot.time, slot.subject);
        const shouldSchedule = masterAlarmEnabled || enabledAlarms.has(alarmId);
        
        if (shouldSchedule) {
          const classTime = parseTimeString(slot.time, currentDate);
          const alarmTime = calculateAlarmTime(classTime);
          
          alarmsToSchedule.push({
            id: alarmId,
            time: slot.time,
            subject: slot.subject,
            date: currentDate,
            alarmTime: alarmTime,
          });
        }
      });

      // Schedule all alarms
      for (const alarm of alarmsToSchedule) {
        await scheduleAlarm(alarm);
      }
    };

    setupAlarms();

    // Cleanup on unmount or when dependencies change
    return () => {
      cancelAllAlarms();
    };
  }, [masterAlarmEnabled, enabledAlarms, selectedDayClasses, currentDate]);

  // Toggle master alarm
  const handleMasterAlarmToggle = async () => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      setMasterAlarmEnabled(prev => !prev);
    } else {
      alert('Please enable notifications to use alarms');
    }
  };

  // Toggle individual alarm
  const handleAlarmToggle = async (alarmId: string) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      alert('Please enable notifications to use alarms');
      return;
    }

    setEnabledAlarms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alarmId)) {
        newSet.delete(alarmId);
        // Cancel this specific alarm
        cancelAlarm(alarmId);
      } else {
        newSet.add(alarmId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTimetable(section);
        console.log(`Loaded ${data.length} days of timetable data for section ${section}`);
        if (data.length === 0) {
          console.warn("Timetable data is empty. This might indicate a parsing issue or the sheet has no data.");
        }
        setTimetableData(data);
      } catch (err: any) {
        console.error("Error loading timetable:", err);
        setError(err.message || "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [section]);

  const selectedDayClasses = useMemo(() => {
    // Normalize currentDate to midnight for comparison
    const normalizedCurrentDate = new Date(currentDate);
    normalizedCurrentDate.setHours(0, 0, 0, 0);
    
    const match = timetableData.find(d => {
      // Normalize dateObj to midnight for comparison
      const normalizedDateObj = new Date(d.dateObj);
      normalizedDateObj.setHours(0, 0, 0, 0);
      
      return normalizedDateObj.getTime() === normalizedCurrentDate.getTime();
    });
    
    // Debug logging
    if (timetableData.length > 0 && !match) {
      console.log(`No classes found for ${normalizedCurrentDate.toLocaleDateString()}. Available dates:`, 
        timetableData.slice(0, 5).map(d => d.dateObj.toLocaleDateString()));
    }
    
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
          
          <div className="flex items-center gap-2">
            {/* Master Alarm Toggle */}
            <button
              onClick={handleMasterAlarmToggle}
              className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm hover:opacity-80 transition-all duration-300 active:scale-95 ${
                masterAlarmEnabled
                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
              }`}
              aria-label="Toggle master alarm"
            >
              {masterAlarmEnabled ? (
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            
            {/* Dark Mode Toggle */}
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
        ) : timetableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
               <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-1 transition-colors duration-300">No Timetable Data</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4 transition-colors duration-300">
              The timetable data could not be loaded or is empty. Please check your connection and try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300"
            >
              Reload
            </button>
          </div>
        ) : selectedDayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
               <CalendarX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-1 transition-colors duration-300">No Classes Scheduled</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto transition-colors duration-300">
              There are no classes listed for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Enjoy your free time!
            </p>
            {timetableData.length > 0 && (
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 transition-colors duration-300">
                Try selecting a different date from the calendar above.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedDayClasses.map((slot, idx) => {
               const alarmId = generateAlarmId(currentDate, slot.time, slot.subject);
               const isAlarmEnabled = masterAlarmEnabled || enabledAlarms.has(alarmId);
               
               return (
                 <ClassCard 
                   key={`${slot.time}-${idx}`} 
                   slot={slot} 
                   isDarkMode={isDarkMode}
                   isAlarmEnabled={isAlarmEnabled}
                   onAlarmToggle={() => handleAlarmToggle(alarmId)}
                   currentDate={currentDate}
                 />
               );
             })}
             
             <div className="pt-8 pb-12 flex justify-center">
                <p className="text-xs text-gray-300 dark:text-gray-600 font-medium uppercase tracking-widest transition-colors duration-300">End of Schedule</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};