import React, { useEffect } from 'react';
import { FrameForm } from './FrameForm';
import { SpectacleFrame } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (frame: SpectacleFrame) => void;
  initialData?: SpectacleFrame | null;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/70 backdrop-blur-sm">
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        {/* Overlay click handler could be added here if needed, but FrameForm has Cancel button */}
        
        <div className="inline-block w-full max-w-6xl p-0 my-8 text-left align-middle transition-all transform animate-scaleIn">
            <div className="relative">
                {/* Close button (X) outside just in case */}
                <button 
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-red-400 transition-colors"
                >
                    <i className="fas fa-times text-2xl"></i>
                </button>

                <FrameForm 
                    initialData={initialData || undefined}
                    onSave={(frame) => {
                        onSave(frame);
                        onClose();
                    }}
                    onCancel={onClose}
                />
            </div>
        </div>
      </div>
    </div>
  );
};