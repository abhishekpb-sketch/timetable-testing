import React, { useEffect, useRef } from 'react';

interface DateSelectorProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  days: Date[];
  isDarkMode: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ currentDate, onSelectDate, days, isDarkMode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected date on mount or change
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentDate]);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm sticky top-0 z-20 transition-colors duration-300">
      <div 
        ref={scrollRef}
        className="flex items-center overflow-x-auto no-scrollbar py-3 px-2 gap-2 snap-x"
      >
        {days.map((day, idx) => {
          const isSelected = day.getDate() === currentDate.getDate() && day.getMonth() === currentDate.getMonth();
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = day.getDate();
          
          return (
            <button 
              key={idx}
              data-selected={isSelected}
              onClick={() => onSelectDate(day)}
              className={`
                flex-shrink-0 snap-center flex flex-col items-center justify-center 
                w-14 h-16 rounded-xl transition-all duration-200 border
                ${isSelected 
                  ? "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50 scale-105" 
                  : "bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                }
              `}
            >
              <span className={`text-xs font-medium ${isSelected ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
                {dayName}
              </span>
              <span className={`text-xl font-bold ${isSelected ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};