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
import { SaleModal } from './components/SaleModal';
import { SaleDetailsModal } from './components/SaleDetailsModal';
import { SpectacleFrame, UserAccount, UserRole, BuyerInfo } from './types';
import { v4 as uuidv4 } from 'uuid';
import { generateReceiptPDF } from './services/receiptGenerator';

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
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'mercadolivre' | 'shopee' | 'amazon' | 'pricing' | 'sold' | 'physical_sales' | 'online_sales'>('home');
  const [editingFrame, setEditingFrame] = useState<SpectacleFrame | null>(null);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  
  // Menu Accordion States
  const [isMarketplaceMenuOpen, setMarketplaceMenuOpen] = useState(false);
  const [isStoreMenuOpen, setStoreMenuOpen] = useState(false);
  
  // Print State
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  
  // Sale Modal State
  const [isSaleModalOpen, setSaleModalOpen] = useState(false);
  const [frameToSell, setFrameToSell] = useState<SpectacleFrame | null>(null);
  const [saleDefaultPlatform, setSaleDefaultPlatform] = useState<string>('inventory');

  // Sale Details View State
  const [isSaleDetailsOpen, setSaleDetailsOpen] = useState(false);
  const [saleDetailsFrame, setSaleDetailsFrame] = useState<SpectacleFrame | null>(null);

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
          // Migrate old generic 'marketplace' to 'mercadolivre'
          if (frame.category === 'marketplace') {
            frame.category = 'mercadolivre';
          }
          if (!frame.category) {
            frame.category = 'inventory';
          }
          // Set default quantity if missing
          if (typeof frame.quantity !== 'number') {
            frame.quantity = 1;
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

  // Auto-expand menus if active tab belongs to them
  useEffect(() => {
    if (['mercadolivre', 'shopee', 'amazon'].includes(activeTab)) {
      setMarketplaceMenuOpen(true);
      setStoreMenuOpen(false);
    } else if (['physical_sales', 'online_sales', 'sold'].includes(activeTab)) {
      setStoreMenuOpen(true);
      setMarketplaceMenuOpen(false);
    }
  }, [activeTab]);

  // --- AUTH HANDLERS ---
  const handleLogin = (user: UserAccount) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    sessionStorage.setItem('otic_auth', 'true');
    sessionStorage.setItem('otic_current_user', JSON.stringify(user));
    
    // VISITOR RESTRICTION: Redirect immediately to Marketplace
    if (user.role === 'Visitante') {
      setActiveTab('mercadolivre');
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
    // Prevent deleting the last user (Lockout protection)
    if (users.length <= 1) {
      alert("Não é possível excluir o único usuário do sistema.");
      return;
    }
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
      setFrames(prev => prev.map(f => {
         // 1. The frame actively being edited
         if (f.id === frame.id) {
             return frame;
         }

         // 2. Sibling frames (same identity as the ORIGINAL editingFrame data)
         const isSibling = f.brand === editingFrame.brand && 
                           f.modelCode === editingFrame.modelCode && 
                           f.colorCode === editingFrame.colorCode;

         if (isSibling) {
             return {
                 ...f,
                 name: frame.name,
                 brand: frame.brand,
                 modelCode: frame.modelCode,
                 colorCode: frame.colorCode,
                 size: frame.size,
                 ean: frame.ean,
                 gender: frame.gender,
                 images: frame.images,
                 
                 lensWidth: frame.lensWidth,
                 lensHeight: frame.lensHeight,
                 templeLength: frame.templeLength,
                 bridgeSize: frame.bridgeSize,
                 frontColor: frame.frontColor,
                 frontMaterial: frame.frontMaterial,
                 templeMaterial: frame.templeMaterial,
                 lensColor: frame.lensColor,
                 lensMaterial: frame.lensMaterial,
                 isPolarized: frame.isPolarized,

                 purchasePrice: frame.purchasePrice,
                 quantity: frame.quantity
             };
         }

         return f;
      }));
      setEditingFrame(null);
    } else {
      // Add new
      setFrames(prev => [frame, ...prev]);
    }
    setRegisterModalOpen(false);
    
    if (frame.category === 'mercadolivre' && activeTab !== 'mercadolivre') {
      setActiveTab('mercadolivre');
    } else if (frame.category === 'shopee' && activeTab !== 'shopee') {
      setActiveTab('shopee');
    } else if (frame.category === 'amazon' && activeTab !== 'amazon') {
      setActiveTab('amazon');
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
      title: 'Limpar Lista',
      message: 'ATENÇÃO: Você está prestes a apagar TODOS os óculos desta lista. Isso não poderá ser revertido. Deseja continuar?',
      action: () => {
        if (activeTab === 'list') {
            setFrames(prev => prev.filter(f => f.category !== 'inventory'));
        } else if (activeTab === 'mercadolivre') {
            setFrames(prev => prev.filter(f => f.category !== 'mercadolivre'));
        } else if (activeTab === 'shopee') {
            setFrames(prev => prev.filter(f => f.category !== 'shopee'));
        } else if (activeTab === 'amazon') {
            setFrames(prev => prev.filter(f => f.category !== 'amazon'));
        } else if (activeTab === 'sold' || activeTab === 'physical_sales' || activeTab === 'online_sales') {
            setFrames(prev => prev.filter(f => !f.isSold));
        }
      }
    });
  };

  const handleEditFrame = (frame: SpectacleFrame) => {
    setEditingFrame(frame);
    setRegisterModalOpen(true);
  };

  const handleViewSale = (frame: SpectacleFrame) => {
    setSaleDetailsFrame(frame);
    setSaleDetailsOpen(true);
  };

  // --- SALE HANDLERS ---
  
  // 1. New Handler for "Cash Register" button (Quick Physical Sale)
  const handlePhysicalSale = (frame: SpectacleFrame) => {
      // Execute direct sale (Qty: 1) for Inventory (Physical Store)
      if (!frame.isSold) {
         setFrameToSell(frame);
         setSaleDefaultPlatform('inventory');
         setSaleModalOpen(true);
      }
  };

  // 2. Updated Trigger for Main "Sell" Button
  const handleStockUpdate = (frame: SpectacleFrame) => {
    if (frame.isSold) {
        // RESTORE: Immediate action, no modal needed
        executeSale(frame, undefined, 0, undefined, true);
    } else {
        // Prepare Modal
        setFrameToSell(frame);
        
        // Determine default platform based on active tab
        let defaultPlat = 'inventory';
        if (['mercadolivre', 'shopee', 'amazon'].includes(activeTab)) {
            defaultPlat = activeTab;
        }
        setSaleDefaultPlatform(defaultPlat);
        setSaleModalOpen(true);
    }
  };

  // Called after modal confirms platform
  const handleConfirmSale = (platform: string, quantity: number, buyerInfo?: BuyerInfo, generateReceipt?: boolean) => {
    if (frameToSell) {
        const saleRecord = executeSale(frameToSell, platform, quantity, buyerInfo, false);
        setSaleModalOpen(false);
        setFrameToSell(null);

        // If requested, generate receipt PDF
        if (generateReceipt && saleRecord) {
             // We need to wait a tick for the state to settle, but we have the object here
             // It's safer to pass the object directly to the generator
             generateReceiptPDF(saleRecord);
        }
    }
  };

  // The actual logic for updating stock
  const executeSale = (frame: SpectacleFrame, platform?: string, qtyToSell: number = 1, buyerInfo?: BuyerInfo, isRestore?: boolean): SpectacleFrame | null => {
    
    // CASE 1: RESTORING A SALE (Undoing)
    if (isRestore) {
        setFrames(prev => {
            if (frame.soldPlatform && frame.isSold) {
                // Remove the historical record
                const remainingFrames = prev.filter(f => f.id !== frame.id);
                // Increment siblings stock
                return remainingFrames.map(f => {
                    const isSibling = f.brand === frame.brand && f.modelCode === frame.modelCode && f.colorCode === frame.colorCode && !f.soldPlatform;
                    if (isSibling) {
                        return { 
                            ...f, 
                            quantity: f.quantity + (frame.soldQuantity || 1), 
                            isSold: false 
                        };
                    }
                    return f;
                });
            } 
            return prev.map(f => {
                 if (f.id === frame.id) {
                     return { ...f, isSold: false, quantity: 1, soldPlatform: undefined, soldAt: undefined, buyerInfo: undefined };
                 }
                 return f;
            });
        });
        return null;
    }

    // CASE 2: NEW SALE
    if (qtyToSell <= 0) return null;

    // Create the "Historical Sales Record" (The Receipt)
    const salesRecord: SpectacleFrame = {
        ...frame,
        id: uuidv4(),
        isSold: true,
        soldPlatform: platform,
        soldQuantity: qtyToSell,
        soldAt: Date.now(),
        quantity: qtyToSell, 
        buyerInfo: buyerInfo, // Save buyer info
    };

    setFrames(prev => {
        const updatedList = prev.map(f => {
            const isTarget = f.id === frame.id;
            const isSibling = f.brand === frame.brand && f.modelCode === frame.modelCode && f.colorCode === frame.colorCode && !f.soldPlatform;
            
            if (isTarget || isSibling) {
                const currentQty = f.quantity;
                const nextQty = Math.max(0, currentQty - qtyToSell);
                
                return {
                    ...f,
                    quantity: nextQty,
                    isSold: nextQty === 0, 
                    // CRITICAL: Ensure the empty stock item does NOT have a platform set, 
                    // so it doesn't show up in the "Sold" list (which filters by soldPlatform)
                    soldPlatform: undefined 
                };
            }
            return f;
        });

        // Add the sales record to the list so it appears in "All Sales"
        return [...updatedList, salesRecord];
    });

    return salesRecord;
  };

  // CLONING logic for marketplaces
  const handleMoveToMarketplace = (frame: SpectacleFrame, newPrice: number, target: 'mercadolivre' | 'shopee' | 'amazon' | 'all') => {
     let newFrames: SpectacleFrame[] = [];
     
     if (target === 'all') {
        const mlFrame = { ...frame, id: uuidv4(), quantity: 1, category: 'mercadolivre' as const, storePrice: newPrice, hasMarketplaceListing: true, createdAt: Date.now() };
        const shopeeFrame = { ...frame, id: uuidv4(), quantity: 1, category: 'shopee' as const, storePrice: newPrice, hasMarketplaceListing: true, createdAt: Date.now() };
        const amazonFrame = { ...frame, id: uuidv4(), quantity: 1, category: 'amazon' as const, storePrice: newPrice, hasMarketplaceListing: true, createdAt: Date.now() };
        
        newFrames = [mlFrame, shopeeFrame, amazonFrame];
        alert("Itens registrados em todos os marketplaces!");
     } else {
         // Create a COPY (Clone) for the specific marketplace
         const newFrame: SpectacleFrame = { 
             ...frame, 
             id: uuidv4(), // Critical: New ID
             category: target, 
             storePrice: newPrice, 
             hasMarketplaceListing: true,
             quantity: 1, // Default to 1 or copy current? Usually 1 for listing
             createdAt: Date.now()
         };
         newFrames = [newFrame];
         alert(`Item registrado no ${target} com sucesso!`);
     }

     setFrames(prev => {
        // 1. Mark the ORIGINAL frame as processed in the Pricing Tab
        const updatedList = prev.map(f => {
            if (f.id === frame.id) {
                return { ...f, hasMarketplaceListing: true };
            }
            return f;
        });

        // 2. Add the new clones
        return [...updatedList, ...newFrames];
     });
  };

  // --- FILTERING ---
  const filterFrames = (category: string) => {
    return frames.filter(f => f.category === category && !f.isSold && (
      searchTerm === '' || 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ean?.includes(searchTerm)
    ));
  };

  const inventoryFrames = filterFrames('inventory');
  const mercadolivreFrames = filterFrames('mercadolivre');
  const shopeeFrames = filterFrames('shopee');
  const amazonFrames = filterFrames('amazon');

  const soldFrames = frames.filter(f => f.isSold && f.soldPlatform && (
    searchTerm === '' || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ean?.includes(searchTerm)
  ));

  const physicalSalesFrames = soldFrames.filter(f => f.soldPlatform === 'inventory');
  const onlineSalesFrames = soldFrames.filter(f => ['mercadolivre', 'shopee', 'amazon'].includes(f.soldPlatform || ''));
  
  let visibleFrames: SpectacleFrame[] = [];
  let currentTitle = '';
  let printCategory: 'inventory' | 'marketplace' | 'sold' = 'inventory'; 
  let framesToPrint: SpectacleFrame[] = []; 

  switch (activeTab) {
    case 'list':
      visibleFrames = inventoryFrames;
      currentTitle = 'Inventário';
      printCategory = 'inventory';
      framesToPrint = frames.filter(f => f.category === 'inventory'); // Include sold in print too
      break;
    case 'mercadolivre':
      visibleFrames = mercadolivreFrames;
      currentTitle = 'Mercado Livre';
      printCategory = 'marketplace';
      framesToPrint = frames.filter(f => f.category === 'mercadolivre');
      break;
    case 'shopee':
      visibleFrames = shopeeFrames;
      currentTitle = 'Shopee';
      printCategory = 'marketplace';
      framesToPrint = frames.filter(f => f.category === 'shopee');
      break;
    case 'amazon':
      visibleFrames = amazonFrames;
      currentTitle = 'Amazon';
      printCategory = 'marketplace';
      framesToPrint = frames.filter(f => f.category === 'amazon');
      break;
    case 'sold':
      visibleFrames = soldFrames;
      currentTitle = 'Todas as Vendas';
      printCategory = 'sold';
      framesToPrint = soldFrames;
      break;
    case 'physical_sales':
      visibleFrames = physicalSalesFrames;
      currentTitle = 'Vendas Físicas';
      printCategory = 'sold';
      framesToPrint = physicalSalesFrames;
      break;
    case 'online_sales':
      visibleFrames = onlineSalesFrames;
      currentTitle = 'Vendas Online';
      printCategory = 'sold';
      framesToPrint = onlineSalesFrames;
      break;
    default:
      visibleFrames = [];
  }

  const userRole = currentUser?.role;

  const mobileNavItems = [
    ...(userRole !== 'Visitante' ? [{ id: 'home', label: 'Início', icon: 'fa-home' }] : []),
    ...(userRole !== 'Visitante' ? [{ id: 'list', label: 'Inventário', icon: 'fa-boxes' }] : []),
    { id: 'mercadolivre', label: 'M. Livre', icon: 'fa-handshake' },
    { id: 'shopee', label: 'Shopee', icon: 'fa-shopping-bag' },
    { id: 'amazon', label: 'Amazon', icon: 'fa-amazon' },
  ];

  const handleHomeSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setActiveTab('list');
    }
  };

  const isActiveMarketplace = ['mercadolivre', 'shopee', 'amazon'].includes(activeTab);
  const isActiveStore = ['physical_sales', 'online_sales', 'sold'].includes(activeTab);

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
      
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-brand-600/20">
            <i className="fas fa-glasses"></i>
          </div>
          <div>
            <h1 className="font-brand font-bold text-slate-800 dark:text-white leading-none">OTIC</h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-widest uppercase">Gerenciador</span>
          </div>
        </div>

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

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {userRole !== 'Visitante' && (
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === 'home'
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <i className="fas fa-home w-5 text-center"></i>
              Início
            </button>
          )}

          {userRole !== 'Visitante' && (
            <button
              onClick={() => setActiveTab('list')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === 'list'
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <i className="fas fa-boxes w-5 text-center"></i>
              Inventário
            </button>
          )}

          <div>
            <button
              onClick={() => setMarketplaceMenuOpen(!isMarketplaceMenuOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                 isActiveMarketplace
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                 <i className="fas fa-store w-5 text-center"></i>
                 Marketplaces
              </div>
              <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isMarketplaceMenuOpen ? 'rotate-90' : ''}`}></i>
            </button>

            {isMarketplaceMenuOpen && (
              <div className="mt-1 space-y-1 pl-4 relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>

                <button
                  onClick={() => setActiveTab('mercadolivre')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative ${
                    activeTab === 'mercadolivre'
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <i className="fas fa-handshake w-5 text-center text-[#ffe600]"></i>
                  Mercado Livre
                </button>

                <button
                  onClick={() => setActiveTab('shopee')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative ${
                    activeTab === 'shopee'
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <i className="fas fa-shopping-bag w-5 text-center text-[#ee4d2d]"></i>
                  Shopee
                </button>

                <button
                  onClick={() => setActiveTab('amazon')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative ${
                    activeTab === 'amazon'
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <i className="fab fa-amazon w-5 text-center text-[#ff9900]"></i>
                  Amazon
                </button>
              </div>
            )}
          </div>

          {userRole !== 'Visitante' && (
            <div>
              <button
                onClick={() => setStoreMenuOpen(!isStoreMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                   isActiveStore
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                   <i className="fas fa-shopping-basket w-5 text-center"></i>
                   Loja
                </div>
                <i className={`fas fa-chevron-right text-xs transition-transform duration-200 ${isStoreMenuOpen ? 'rotate-90' : ''}`}></i>
              </button>

              {isStoreMenuOpen && (
                <div className="mt-1 space-y-1 pl-4 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>

                   <button
                    onClick={() => setActiveTab('sold')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative ${
                        activeTab === 'sold'
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    >
                    <i className="fas fa-box-open w-5 text-center"></i>
                    Todas as Vendas
                    </button>

                  <button
                    onClick={() => setActiveTab('physical_sales')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative ${
                      activeTab === 'physical_sales'
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <i className="fas fa-cash-register w-5 text-center"></i>
                    Vendas Físicas
                  </button>

                  <button
                    onClick={() => setActiveTab('online_sales')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm relative ${
                      activeTab === 'online_sales'
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <i className="fas fa-laptop w-5 text-center"></i>
                    Vendas Online
                  </button>
                </div>
              )}
            </div>
          )}

          {userRole !== 'Visitante' && (
             <button
               onClick={() => setActiveTab('pricing')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                 activeTab === 'pricing'
                   ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                   : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
               }`}
             >
               <i className="fas fa-calculator w-5 text-center"></i>
               Precificador
             </button>
          )}

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
                 <p className="text-xs text-slate-500 dark:text-slate-400 truncate uppercase font-bold tracking-wider">{currentUser.role}</p>
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-30 pb-safe overflow-x-auto">
         {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-colors flex-shrink-0 ${
                 activeTab === item.id 
                 ? 'text-brand-600 dark:text-brand-400' 
                 : 'text-slate-400 dark:text-slate-500'
              }`}
            >
               <i className={`fas ${item.icon} text-lg mb-1`}></i>
               <span className="text-[9px] font-bold">{item.label.split(' ')[0]}</span>
            </button>
         ))}
      </nav>

      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 transition-colors">
           
           {activeTab !== 'home' ? (
              <div className="flex-1 max-w-xl relative animate-fadeIn">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                <input 
                  type="text" 
                  placeholder={`Pesquisar em ${currentTitle}...`}
                  className="w-full bg-slate-100 dark:bg-slate-700/50 border-none rounded-xl pl-10 pr-4 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           ) : (
              <div className="flex-1"></div> 
           )}

           <div className="flex items-center gap-3 ml-4">
              
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all flex items-center justify-center"
                title="Alternar Tema"
              >
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          
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
                  Utilize a busca abaixo para encontrar óculos no inventário ou navegue pelo menu lateral.
                </p>
                
                <div className="max-w-2xl mx-auto mt-8 px-4">
                  <div className="relative group">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors"></i>
                    <input
                      type="text"
                      placeholder="Pesquisar por marca, modelo, cor ou EAN..."
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-6 text-lg shadow-lg shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/30 focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-white transition-all outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleHomeSearchEnter}
                      autoFocus
                    />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">
                    Pressione <span className="font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Enter</span> para ver os resultados no inventário.
                  </p>
                </div>

             </div>
          )}

          {(activeTab !== 'home' && activeTab !== 'pricing') && (
            <div className="animate-fadeIn">
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                      {activeTab === 'list' && <i className="fas fa-boxes text-brand-600 dark:text-brand-400"></i>}
                      {activeTab === 'mercadolivre' && <i className="fas fa-handshake text-[#ffe600]"></i>}
                      {activeTab === 'shopee' && <i className="fas fa-shopping-bag text-[#ee4d2d]"></i>}
                      {activeTab === 'amazon' && <i className="fab fa-amazon text-[#ff9900]"></i>}
                      {activeTab === 'sold' && <i className="fas fa-box-open text-brand-600 dark:text-brand-400"></i>}
                      {(activeTab === 'physical_sales') && <i className="fas fa-cash-register text-brand-600 dark:text-brand-400"></i>}
                      {(activeTab === 'online_sales') && <i className="fas fa-laptop text-brand-600 dark:text-brand-400"></i>}
                      {currentTitle}
                      <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full ml-2">
                        {visibleFrames.length}
                      </span>
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {activeTab === 'list' && userRole !== 'Visitante' && (
                        <button 
                          onClick={() => { setEditingFrame(null); setRegisterModalOpen(true); }}
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold shadow hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2 text-sm"
                        >
                          <i className="fas fa-plus"></i> Novo Registro
                        </button>
                    )}

                    <button 
                      onClick={() => setPrintModalOpen(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg font-bold hover:border-brand-400 hover:text-brand-600 transition-all flex items-center gap-2 text-sm shadow-sm"
                    >
                      <i className="fas fa-print"></i> Imprimir
                    </button>
                    
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

               <FrameList 
                 frames={visibleFrames} 
                 onDelete={handleDeleteFrame}
                 onEdit={handleEditFrame}
                 onToggleStatus={handleStockUpdate} 
                 onPhysicalSale={handlePhysicalSale} 
                 onViewSale={handleViewSale}
                 userRole={userRole}
                 currentCategory={activeTab} 
               />
            </div>
          )}

          {activeTab === 'pricing' && (
            <PricingTab 
              frames={frames} 
              onMoveToMarketplace={handleMoveToMarketplace}
            />
          )}

        </div>
      </main>

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

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => { setSaleModalOpen(false); setFrameToSell(null); }}
        onConfirm={handleConfirmSale}
        maxQuantity={frameToSell?.quantity}
        defaultPlatform={saleDefaultPlatform}
      />

      <SaleDetailsModal
        isOpen={isSaleDetailsOpen}
        onClose={() => { setSaleDetailsOpen(false); setSaleDetailsFrame(null); }}
        frame={saleDetailsFrame}
      />

    </div>
  );
};

export default App;