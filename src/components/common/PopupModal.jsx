import React from 'react';
import Button from './Button';

const PopupModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;

  const bgColors = {
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-black border-2 border-white p-6 rounded-lg w-11/12 max-w-sm">
        <div className={`${bgColors[type]} p-2 rounded mb-4`}>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-white mb-6">{message}</p>
        <Button onClick={onClose}>OK</Button>
      </div>
    </div>
  );
};

export default PopupModal;