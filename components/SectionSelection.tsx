import React from 'react';
import { Section } from '../types';
import { SECTIONS } from '../constants';
import { BookOpen, Sparkles, Moon, Sun } from 'lucide-react';

interface SectionSelectionProps {
  onSelect: (sec: Section) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelect, isDarkMode, onToggleDarkMode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 py-6 transition-colors duration-300 relative">
      {/* Dark Mode Toggle Button */}
      <button
        onClick={onToggleDarkMode}
        className="absolute top-6 right-6 w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-300 active:scale-95 z-10"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <Moon className="w-5 h-5 text-blue-600" />
        )}
      </button>
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-blue-400 dark:bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-500 dark:to-indigo-600 p-4 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/50">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center tracking-tight transition-colors duration-300">Timetable</h1>
      
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {SECTIONS.map((sec) => (
          <button
            key={sec}
            onClick={() => onSelect(sec as Section)}
            className={`
                relative group overflow-hidden bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
                hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/50 transition-all duration-300
                ${sec === 'E' ? 'col-span-2' : ''}
            `}
          >
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-blue-50 dark:from-blue-900/30 to-transparent rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110"></div>
            
            <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl mb-2 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                {sec}
                </div>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Section</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
        {/* <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" /> */}
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          Crafted with caffeine and chaos by <a href="https://www.linkedin.com/in/abhishek-p-b-b20531390/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors">Abhishek</a>✨
        </span>
      </div>
    </div>
  );
};