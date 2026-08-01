import React, { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    resolve: null,
  });

  const confirm = (message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        resolve,
      });
    });
  };

  const handleClose = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState({ isOpen: false, title: 'Confirm Action', message: '', resolve: null });
  };

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState({ isOpen: false, title: 'Confirm Action', message: '', resolve: null });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal isOpen={modalState.isOpen} onClose={handleClose} title={modalState.title}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{modalState.message}</p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
