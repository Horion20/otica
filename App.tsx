import React, { useState, useEffect } from 'react';
import { FrameForm } from './components/FrameForm';
import { FrameList } from './components/FrameList';
import { PricingTab } from './components/PricingTab';
import { ImportModal } from './components/ImportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import { RegisterModal } from './components/RegisterModal';
import { PrintModal } from './components/PrintModal';
import { ProfileModal } from './components/ProfileModal';
import { UserManagementModal } from './components/UserManagementModal';
import { SpectacleFrame, UserAccount, UserRole } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // --- USER AUTH & MANAGEMENT STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isUserManagementOpen, setUserManagementOpen] = useState(false);

  // Initialize Users (Create default General Manager if empty)
  useEffect(() => {
    const savedUsers = localStorage.getItem('otic_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Default User: Otic / Otic25 (Gerente Geral)
      const defaultUser: UserAccount = {
        id: uuidv4(),
        username: 'Otic',
        password: 'Otic25',
        name: 'Administrador Padrão',
        role: 'Gerente Geral',
        avatar: null,
        createdAt: Date.now()
      };
      const initialUsers = [defaultUser];
      setUsers(initialUsers);
      localStorage.setItem('otic_users', JSON.stringify(initialUsers));
    }
  }, []);

  // Save users to storage whenever changed
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('otic_users', JSON.stringify(users));
    }
  }, [users]);

  // Session Check
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('otic_auth');
    const sessionUser = sessionStorage.getItem('otic_current_user');
    if (sessionAuth === 'true' && sessionUser) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(sessionUser));
    }
  }, []);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('otic_theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  // Apply theme class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('otic_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- DATA STATE ---
  const [frames, setFrames] = useState<SpectacleFrame[]>([]);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  
  // Navigation & Edit State
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'marketplace' | 'pricing' | 'sold'>('home');
  const [editingFrame, setEditingFrame] = useState<SpectacleFrame | null>(null);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  
  // Print State
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  
  // View Mode State (Grid vs List)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Load Frames from localStorage on mount and migrate data structure
  useEffect(() => {
    const saved = localStorage.getItem('optiRegistryFrames');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // MIGRATION Logic
        const migratedFrames = parsed.map((f: any) => {
          let frame = { ...f };
          if (!frame.images) {
            frame.images = frame.imageUrl ? [frame.imageUrl] : [];
          }
          if (!frame.category) {
            frame.category = 'inventory';
          }
          return frame;
        });

        setFrames(migratedFrames);
      } catch (e) {
        console.error("Failed to parse saved frames");
      }
    }
  }, []);

  // Save Frames to localStorage on change
  useEffect(() => {
    localStorage.setItem('optiRegistryFrames', JSON.stringify(frames));
  }, [frames]);

  // --- AUTH HANDLERS ---
  const handleLogin = (user: UserAccount) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    sessionStorage.setItem('otic_auth', 'true');
    sessionStorage.setItem('otic_current_user', JSON.stringify(user));
    
    // VISITOR RESTRICTION: Redirect immediately to Marketplace
    if (user.role === 'Visitante') {
      setActiveTab('marketplace');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('otic_auth');
    sessionStorage.removeItem('otic_current_user');
    setActiveTab('home');
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleAddUser = (newUser: UserAccount) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If updating current user (self), update session
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        sessionStorage.setItem('otic_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleUpdateProfile = (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    handleUpdateUser(updated);
  };

  // --- FRAME HANDLERS ---
  const handleSaveFrame = (frame: SpectacleFrame) => {
    if (editingFrame) {
      // Update existing
      setFrames(prev => prev.map(f => f.id === frame.id ? frame : f));
      setEditingFrame(null);
    } else {
      // Add new
      setFrames(prev => [frame, ...prev]);
    }
    // Close Modal
    setRegisterModalOpen(false);
    
    // Automatically switch to list if not there
    if (frame.category === 'marketplace' && activeTab !== 'marketplace') {
      setActiveTab('marketplace');
    } else if (frame.category === 'inventory' && activeTab !== 'list' && activeTab !== 'home') {
      setActiveTab('list');
    }
  };

  const handleBulkImport = (newFrames: SpectacleFrame[]) => {
    setFrames(prev => [...newFrames, ...prev]);
    setActiveTab('list');
  };

  const handleDeleteFrame = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Registro',
      message: 'Tem certeza que deseja excluir este óculos permanentemente? Esta ação não pode ser desfeita.',
      action: () => {
        setFrames(prev => prev.filter(f => f.id !== id));
        if (editingFrame?.id === id) {
          setEditingFrame(null);
        }
      }
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Limpar Sistema Completo',
      message: 'ATENÇÃO: Você está prestes a apagar TODOS os óculos desta lista. Isso não poderá ser revertido. Deseja continuar?',
      action: () => {
        // Only clear frames belonging to the current view
        if (activeTab === 'list') {
            setFrames(prev => prev.filter(f => f.category !== 'inventory' && !f.isSold));
        } else if (activeTab === 'marketplace') {
            setFrames(prev => prev.filter(f => f.category !== 'marketplace' && !f.isSold));
        } else if (activeTab === 'sold') {
            setFrames(prev => prev.filter(f => !f.isSold));
        } else {
            // If home or other, verify intent? Let's just clear inventory by default
            setFrames([]);
        }
      }
    });
  };

  const handleEditFrame = (frame: SpectacleFrame) => {
    setEditingFrame(frame);
    setRegisterModalOpen(true);
  };

  const handleToggleStatus = (frame: SpectacleFrame) => {
    const updatedFrame = { ...frame, isSold: !frame.isSold };
    setFrames(prev => prev.map(f => f.id === frame.id ? updatedFrame : f));
  };

  const handleMoveToMarketplace = (frame: SpectacleFrame, newPrice: number) => {
     const updatedFrame: SpectacleFrame = {
       ...frame,
       category: 'marketplace',
       storePrice: newPrice, // Update price to calculated one
       hasMarketplaceListing: true
     };
     setFrames(prev => prev.map(f => f.id === frame.id ? updatedFrame : f));
     setActiveTab('marketplace');
  };

  // --- FILTERING ---
  // Inventory: Category 'inventory' AND Not Sold
  const inventoryFrames = frames.filter(f => f.category === 'inventory' && !f.isSold && (
    searchTerm === '' || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ean?.includes(searchTerm)
  ));

  // Marketplace: Category 'marketplace' AND Not Sold
  const marketplaceFrames = frames.filter(f => f.category === 'marketplace' && !f.isSold && (
    searchTerm === '' || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ean?.includes(searchTerm)
  ));

  // Sold: Any Category AND Is Sold
  const soldFrames = frames.filter(f => f.isSold && (
    searchTerm === '' || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ean?.includes(searchTerm)
  ));
  
  // Decide what to show based on active tab
  let visibleFrames: SpectacleFrame[] = [];
  let currentTitle = '';
  let printCategory: 'inventory' | 'marketplace' | 'sold' = 'inventory';
  // List of all frames for the current category (ignoring pagination/search for printing)
  let framesToPrint: SpectacleFrame[] = []; 

  switch (activeTab) {
    case 'list':
      visibleFrames = inventoryFrames;
      currentTitle = 'Inventário';
      printCategory = 'inventory';
      // For printing from Inventory tab, we pass ALL inventory items (sold or not) 
      // or just the filtered ones? The request was to allow filtering inside modal.
      // So we pass all items that ORIGINATED in inventory or are currently there.
      // Simpler: Pass everything, modal filters.
      framesToPrint = frames.filter(f => f.category === 'inventory'); 
      break;
    case 'marketplace':
      visibleFrames = marketplaceFrames;
      currentTitle = 'Mercado Livre';
      printCategory = 'marketplace';
      framesToPrint = frames.filter(f => f.category === 'marketplace');
      break;
    case 'sold':
      visibleFrames = soldFrames;
      currentTitle = 'Vendidos';
      printCategory = 'sold';
      framesToPrint = frames.filter(f => f.isSold);
      break;
    default:
      visibleFrames = [];
  }

  // --- PERMISSIONS / MENU CONFIG ---
  const userRole = currentUser?.role;

  // Define Navigation Items based on Role
  const navItems = [
    // Home: Admin & Gerente only
    ...(userRole !== 'Visitante' ? [{ id: 'home', label: 'Início', icon: 'fa-home' }] : []),
    
    // Inventory: Admin & Gerente only
    ...(userRole !== 'Visitante' ? [{ id: 'list', label: 'Inventário', icon: 'fa-glasses' }] : []),
    
    // Marketplace: Everyone
    { id: 'marketplace', label: 'Mercado Livre', icon: 'fa-store' },
    
    // Pricing: Admin & Gerente only
    ...(userRole !== 'Visitante' ? [{ id: 'pricing', label: 'Precificador', icon: 'fa-tags' }] : []),

    // Sold: Admin & Gerente only (Visitor only sees ML, assuming they don't need history)
    ...(userRole !== 'Visitante' ? [{ id: 'sold', label: 'Vendidos', icon: 'fa-box-open' }] : []),
  ];

  // --- RENDER ---
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        users={users} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300 font-sans">
      
      {/* 1. SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 transition-colors">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-brand-600/20">
            <i className="fas fa-glasses"></i>
          </div>
          <div>
            <h1 className="font-brand font-bold text-slate-800 dark:text-white leading-none">OTIC</h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-widest uppercase">Gerenciador</span>
          </div>
        </div>

        {/* Action Buttons (Import - Hidden for Visitor) */}
        {userRole !== 'Visitante' && (
          <div className="p-4">
             <button
               onClick={() => setImportModalOpen(true)}
               className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
             >
               <i className="fas fa-file-import"></i> Importar Dados
             </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              {item.label}
            </button>
          ))}
          
          {/* User Management Link (Gerente Geral Only) */}
          {userRole === 'Gerente Geral' && (
             <>
               <div className="my-2 border-t border-slate-100 dark:border-slate-700 mx-2"></div>
               <button
                  onClick={() => setUserManagementOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <i className="fas fa-users-cog w-5 text-center"></i>
                  Gerenciar Equipe
                </button>
             </>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
           <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => setProfileModalOpen(true)}>
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-slate-600 flex items-center justify-center text-brand-600 dark:text-slate-300 font-bold border border-brand-200 dark:border-slate-500 overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                 <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase font-bold tracking-wider">{currentUser.role}</p>
              </div>
              <i className="fas fa-chevron-right text-xs text-slate-400"></i>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider"
           >
             <i className="fas fa-sign-out-alt"></i> Sair
           </button>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-30 pb-safe">
         {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-16 transition-colors ${
                 activeTab === item.id 
                 ? 'text-brand-600 dark:text-brand-400' 
                 : 'text-slate-400 dark:text-slate-500'
              }`}
            >
               <i className={`fas ${item.icon} text-lg mb-1`}></i>
               <span className="text-[9px] font-bold">{item.label}</span>
            </button>
         ))}
         {/* Mobile Menu More (Profile/Logout could go here in a real app) */}
         <button
            onClick={() => setProfileModalOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg w-16 text-slate-400 dark:text-slate-500"
         >
             <i className="fas fa-user text-lg mb-1"></i>
             <span className="text-[9px] font-bold">Perfil</span>
         </button>
      </nav>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Toolbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 transition-colors">
           
           {/* Search Bar */}
           <div className="flex-1 max-w-xl relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
              <input 
                type="text" 
                placeholder={activeTab === 'home' ? "O que você procura?" : `Pesquisar em ${currentTitle}...`}
                className="w-full bg-slate-100 dark:bg-slate-700/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           {/* Right Actions */}
           <div className="flex items-center gap-3 ml-4">
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all flex items-center justify-center"
                title="Alternar Tema"
              >
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>

              {/* View Toggle (Grid/List) - Only on lists */}
              {(activeTab === 'list' || activeTab === 'marketplace' || activeTab === 'sold') && (
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex">
                   <button 
                     onClick={() => setViewMode('grid')}
                     className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     <i className="fas fa-th-large"></i>
                   </button>
                   <button 
                     onClick={() => setViewMode('list')}
                     className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     <i className="fas fa-list"></i>
                   </button>
                </div>
              )}
           </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
             <div className="max-w-4xl mx-auto text-center py-20 animate-fadeIn">
                <div className="mb-8 relative inline-block">
                   <div className="absolute inset-0 bg-brand-200 dark:bg-brand-900 blur-3xl opacity-20 rounded-full"></div>
                   <div className="relative w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl mx-auto rotate-3 hover:rotate-6 transition-transform duration-500">
                     <i className="fas fa-glasses"></i>
                   </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4 font-brand">Bem-vindo ao Gerenciador</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
                  Utilize o menu lateral para navegar entre o inventário, gerenciar vendas no Mercado Livre ou precificar novos itens.
                </p>
                
                {/* Shortcuts */}
                {userRole !== 'Visitante' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                      <button onClick={() => setRegisterModalOpen(true)} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-lg transition-all group">
                        <i className="fas fa-plus-circle text-2xl text-brand-500 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p className="font-bold text-slate-700 dark:text-slate-300">Novo Item</p>
                      </button>
                      <button onClick={() => setImportModalOpen(true)} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-lg transition-all group">
                        <i className="fas fa-file-import text-2xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p className="font-bold text-slate-700 dark:text-slate-300">Importar</p>
                      </button>
                      <button onClick={() => setActiveTab('list')} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-lg transition-all group">
                        <i className="fas fa-boxes text-2xl text-purple-500 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p className="font-bold text-slate-700 dark:text-slate-300">Estoque</p>
                      </button>
                      <button onClick={() => setActiveTab('pricing')} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-lg transition-all group">
                        <i className="fas fa-calculator text-2xl text-green-500 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p className="font-bold text-slate-700 dark:text-slate-300">Precificar</p>
                      </button>
                  </div>
                )}
             </div>
          )}

          {/* LIST / MARKETPLACE / SOLD VIEWS */}
          {(activeTab === 'list' || activeTab === 'marketplace' || activeTab === 'sold') && (
            <div className="animate-fadeIn">
               
               {/* List Header / Toolbar */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      {activeTab === 'list' && <i className="fas fa-boxes text-brand-600 dark:text-brand-400"></i>}
                      {activeTab === 'marketplace' && <i className="fas fa-store text-brand-600 dark:text-brand-400"></i>}
                      {activeTab === 'sold' && <i className="fas fa-box-open text-brand-600 dark:text-brand-400"></i>}
                      {currentTitle}
                      <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full ml-2">
                        {visibleFrames.length}
                      </span>
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* New Record Button (Only for Inventory and Non-Visitors) */}
                    {activeTab === 'list' && userRole !== 'Visitante' && (
                        <button 
                          onClick={() => { setEditingFrame(null); setRegisterModalOpen(true); }}
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold shadow hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2 text-sm"
                        >
                          <i className="fas fa-plus"></i> Novo Registro
                        </button>
                    )}

                    {/* Print Button */}
                    <button 
                      onClick={() => setPrintModalOpen(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg font-bold hover:border-brand-400 hover:text-brand-600 transition-all flex items-center gap-2 text-sm shadow-sm"
                    >
                      <i className="fas fa-print"></i> Imprimir
                    </button>
                    
                    {/* Clear Button (Admin/Gerente only) */}
                    {visibleFrames.length > 0 && userRole !== 'Visitante' && (
                       <button 
                        onClick={handleClearAll}
                        className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Limpar Lista"
                       >
                         <i className="fas fa-trash-alt"></i>
                       </button>
                    )}
                  </div>
               </div>

               {/* The List */}
               <FrameList 
                 frames={visibleFrames} 
                 viewMode={viewMode}
                 onDelete={handleDeleteFrame}
                 onEdit={handleEditFrame}
                 onToggleStatus={handleToggleStatus}
                 userRole={userRole}
               />
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <PricingTab 
              frames={frames} 
              onMoveToMarketplace={handleMoveToMarketplace}
            />
          )}

        </div>
      </main>

      {/* MODALS */}
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => { setRegisterModalOpen(false); setEditingFrame(null); }} 
        onSave={handleSaveFrame}
        initialData={editingFrame}
      />

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onImport={handleBulkImport}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        frames={framesToPrint}
        title={`Relatório de ${currentTitle}`}
        category={printCategory}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onSave={handleUpdateProfile}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setUserManagementOpen(false)}
        users={users}
        currentUserId={currentUser.id}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

    </div>
  );
};

export default App;