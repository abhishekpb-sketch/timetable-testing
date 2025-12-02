import React from 'react';
import { Section } from '../types';
import { SECTIONS } from '../constants';
import { BookOpen, Sparkles } from 'lucide-react';

interface SectionSelectionProps {
  onSelect: (sec: Section) => void;
}

export const SectionSelection: React.FC<SectionSelectionProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-xl shadow-blue-200">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-10 text-center tracking-tight">Timetable</h1>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {SECTIONS.map((sec) => (
          <button
            key={sec}
            onClick={() => onSelect(sec as Section)}
            className={`
                relative group overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100 
                hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300
                ${sec === 'E' ? 'col-span-2' : ''}
            `}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div className="relative flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                {sec}
                </div>
                <span className="text-sm font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">Section</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span className="text-xs text-gray-400 font-medium">
          Crafted with caffeine and chaos by <a href="https://www.linkedin.com/in/abhishek-p-b-b20531390/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors">Abhishek</a> ☕✨
        </span>
      </div>
    </div>
  );
};