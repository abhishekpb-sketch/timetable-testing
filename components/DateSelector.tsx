import React, { useEffect, useRef } from 'react';

interface DateSelectorProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  days: Date[];
}

export const DateSelector: React.FC<DateSelectorProps> = ({ currentDate, onSelectDate, days }) => {
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
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
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
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                  : "bg-transparent border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200"
                }
              `}
            >
              <span className={`text-xs font-medium ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                {dayName}
              </span>
              <span className={`text-xl font-bold ${isSelected ? "text-white" : "text-gray-900"}`}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};