import React, { useState, useRef, useEffect } from 'react';
import { Input } from './Input';
import { UserAccount } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSave: (profile: Partial<UserAccount>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setAvatar(currentUser.avatar);
      setNewPassword(''); // Reset password field
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<UserAccount> = { name, avatar };
    if (newPassword) {
      updates.password = newPassword;
    }
    onSave(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-colors">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-id-card text-brand-600 dark:text-brand-400"></i>
            Meu Perfil
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-28 h-28 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer group shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-50 dark:bg-slate-700 flex items-center justify-center text-brand-200 dark:text-slate-500">
                  <i className="fas fa-user text-4xl"></i>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <i className="fas fa-camera text-white text-xl"></i>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">Clique na foto para alterar</p>
          </div>

          <div className="space-y-4">
            <Input 
              label="Nome de Usuário" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Seu nome"
              required
            />

            {/* Read Only Role */}
            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
               <div className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                  {currentUser.role}
               </div>
               <p className="text-[10px] text-slate-400">Apenas o Gerente Geral pode alterar cargos.</p>
            </div>

            <Input 
              label="Alterar Senha" 
              type="password"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Deixe em branco para manter a atual"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all active:scale-95"
            >
              Salvar Perfil
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};