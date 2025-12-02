import React from 'react';
import { TimeSlot } from '../types';
import { Clock, MapPin } from 'lucide-react';

interface ClassCardProps {
  slot: TimeSlot;
}

const getSubjectStyles = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes("quiz") || s.includes("exam") || s.includes("mid term") || s.includes("end term")) 
    return "bg-red-50 text-red-900 border-red-200 ring-red-100";
  if (s.includes("macro") || s.includes("econ")) 
    return "bg-blue-50 text-blue-900 border-blue-200 ring-blue-100";
  if (s.includes("cf/") || s.includes("finance")) 
    return "bg-emerald-50 text-emerald-900 border-emerald-200 ring-emerald-100";
  if (s.includes("dem") || s.includes("decision")) 
    return "bg-purple-50 text-purple-900 border-purple-200 ring-purple-100";
  if (s.includes("ba/") || s.includes("analytics") || s.includes("stat")) 
    return "bg-orange-50 text-orange-900 border-orange-200 ring-orange-100";
  if (s.includes("oad") || s.includes("analysis")) 
    return "bg-teal-50 text-teal-900 border-teal-200 ring-teal-100";
  if (s.includes("wc") || s.includes("comm")) 
    return "bg-indigo-50 text-indigo-900 border-indigo-200 ring-indigo-100";
  if (s.includes("hrm")) 
    return "bg-pink-50 text-pink-900 border-pink-200 ring-pink-100";
  if (s.includes("club") || s.includes("event") || s.includes("guest")) 
    return "bg-amber-50 text-amber-900 border-amber-200 ring-amber-100";
    
  return "bg-white text-gray-800 border-gray-200 ring-gray-100";
};

export const ClassCard: React.FC<ClassCardProps> = ({ slot }) => {
  const styles = getSubjectStyles(slot.subject);

  return (
    <div className={`relative p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${styles}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-tight mb-2">{slot.subject}</h3>
          
          <div className="flex items-center gap-4 text-sm opacity-80 font-medium">
             <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Ground Floor</span>
             </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-black/5 shadow-sm">
                <Clock className="w-4 h-4" />
                <span className="font-bold font-mono tracking-tight">{slot.time}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
