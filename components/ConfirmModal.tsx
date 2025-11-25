import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirmar", 
  onConfirm, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
       <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
              <i className="fas fa-exclamation-triangle text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">{message}</p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => { onConfirm(); onClose(); }} 
                  className="px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 hover:bg-red-700 active:scale-95 transition-all text-sm flex items-center gap-2"
                >
                  <i className="fas fa-trash-alt"></i> {confirmText}
                </button>
              </div>
            </div>
          </div>
       </div>
    </div>
  );
};