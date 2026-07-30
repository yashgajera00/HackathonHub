import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000); // clear after 4 seconds
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-lg ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-100'
              : 'bg-blue-50 text-blue-800 border-blue-100'
          }`}>
            {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-blue-600 flex-shrink-0" />}
            
            <p className="text-sm font-medium pr-2">{toast.message}</p>
            
            <button onClick={closeToast} className="text-gray-400 hover:text-gray-600 transition">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
