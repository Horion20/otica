import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { Input } from './Input';
import { Select } from './Select';
import { v4 as uuidv4 } from 'uuid';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUserId
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingUser, setEditingUser] = useState<Partial<UserAccount>>({});
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Visitante' as UserRole
  });

  if (!isOpen) return null;

  const handleCreateNew = () => {
    setEditingUser({});
    setFormData({ username: '', password: '', name: '', role: 'Visitante' });
    setView('form');
  };

  const handleEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password || '', // Usually hidden, but for simplicity in this demo we allow editing
      name: user.name,
      role: user.role
    });
    setView('form');
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      onDeleteUser(userId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser.id) {
      // Update
      onUpdateUser({
        ...editingUser as UserAccount,
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role
      });
    } else {
      // Create
      const newUser: UserAccount = {
        id: uuidv4(),
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        avatar: null,
        createdAt: Date.now()
      };
      onAddUser(newUser);
    }
    setView('list');
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transition-colors flex flex-col max-h-[85vh]">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-users-cog text-brand-600 dark:text-brand-400"></i>
            Gerenciar Equipe
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' ? (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                 <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie logins e níveis de acesso.</p>
                 <button 
                   onClick={handleCreateNew}
                   className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-md transition-all flex items-center gap-2"
                 >
                   <i className="fas fa-user-plus"></i> Novo Usuário
                 </button>
               </div>

               <div className="grid gap-3">
                 {users.map(user => (
                   <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold overflow-hidden">
                            {user.avatar ? (
                               <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                               <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                               <span><i className="fas fa-user-tag"></i> {user.username}</span>
                               <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                 user.role === 'Gerente Geral' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                 user.role === 'Administrador' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                               }`}>
                                 {user.role}
                               </span>
                            </p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleEdit(user)}
                           className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                           title="Editar"
                         >
                           <i className="fas fa-pencil-alt"></i>
                         </button>
                         {user.id !== currentUserId && (
                           <button 
                             onClick={() => handleDelete(user.id)}
                             className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                             title="Remover"
                           >
                             <i className="fas fa-trash-alt"></i>
                           </button>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
               <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-brand-600" onClick={() => setView('list')}>
                  <i className="fas fa-arrow-left"></i>
                  <span className="text-sm font-bold">Voltar para lista</span>
               </div>

               <Input
                  label="Nome Completo"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  required
               />
               <Input
                  label="ID de Login"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                  required
                  placeholder="Ex: joao.silva"
               />
               <Input
                  label="Senha"
                  type="text" // Visible for easy management as per prompt request implicity
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  required
                  placeholder="Crie uma senha"
               />
               <Select
                  label="Cargo"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({...prev, role: e.target.value as UserRole}))}
                  options={[
                    { value: 'Visitante', label: 'Visitante (Apenas Visualização ML)' },
                    { value: 'Administrador', label: 'Administrador (Editar/Excluir)' },
                    { value: 'Gerente Geral', label: 'Gerente Geral (Acesso Total)' }
                  ]}
               />

               <div className="pt-4">
                 <button 
                   type="submit"
                   className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-all active:scale-95"
                 >
                   {editingUser.id ? 'Atualizar Usuário' : 'Criar Usuário'}
                 </button>
               </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};