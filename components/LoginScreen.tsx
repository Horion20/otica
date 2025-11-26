import React, { useState } from 'react';
import { UserAccount } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, users }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find matching user
    const user = users.find(u => u.username === id && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      setError('ID ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 animate-fadeIn transition-colors">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-brand-50 dark:bg-slate-700 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-brand-100 dark:border-slate-600">
             <i className="fas fa-glasses"></i>
           </div>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-brand uppercase tracking-wider">Gerenciador Comercial</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2">Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/30">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID de Acesso</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors">
                 <i className="fas fa-user"></i>
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 focus:border-brand-500 transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                placeholder="Digite seu ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
             <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors">
                 <i className="fas fa-lock"></i>
              </div>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 focus:border-brand-500 transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 hover:shadow-brand-600/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Entrar <i className="fas fa-arrow-right"></i>
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-700 pt-6">
           <p className="text-xs text-slate-400 dark:text-slate-500">
             &copy; {new Date().getFullYear()} Gerenciador Comercial.<br/>Todos os direitos reservados.
           </p>
        </div>
      </div>
    </div>
  );
};