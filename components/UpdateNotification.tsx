import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate, onDismiss }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-blue-600 text-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-blue-700">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Update Available</p>
          <p className="text-xs text-blue-100">A new version is ready. Refresh to update.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors active:scale-95"
          >
            Update
          </button>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors active:scale-95"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

