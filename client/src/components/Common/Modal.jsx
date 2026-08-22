import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 md:p-6">
        <div
          className={`relative w-full ${maxWidth} max-h-[92vh] flex flex-col transform rounded-2xl bg-white p-4 sm:p-6 text-left shadow-2xl transition-all border border-stone-200`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 shrink-0">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 pr-1 -mr-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
