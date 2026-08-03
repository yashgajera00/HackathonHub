import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
      ></div>

      {/* Modal Box */}
      <div className="relative bg-white border border-gray-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-gray-900 font-display">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-600">{children}</div>
      </div>
    </div>
  );
}
