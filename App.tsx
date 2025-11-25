import React, { useState, useEffect } from 'react';
import { FrameForm } from './components/FrameForm';
import { FrameList } from './components/FrameList';
import { PricingTab } from './components/PricingTab';
import { ImportModal } from './components/ImportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import { SpectacleFrame } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [frames, setFrames] = useState<SpectacleFrame[]>([]);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  
  // Navigation & Edit State
  const [activeTab, setActiveTab] = useState<'home' | 'register' | 'list' | 'marketplace' | 'pricing'>('home');
  const [editingFrame, setEditingFrame] = useState<SpectacleFrame | null>(null);
  
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

  // Check session on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('otic_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Load from localStorage on mount and migrate data structure
  useEffect(() => {
    const saved = localStorage.getItem('optiRegistryFrames');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // MIGRATION Logic
        const migratedFrames = parsed.map((f: any) => {
          let frame = { ...f };
          
          // 1. Convert old 'imageUrl' (string) to 'images' (string[])
          if (!frame.images) {
            frame.images = frame.imageUrl ? [frame.imageUrl] : [];
          }
          
          // 2. Ensure category exists (Default to 'inventory')
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

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('optiRegistryFrames', JSON.stringify(frames));
  }, [frames]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('otic_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('otic_auth');
    setActiveTab('home');
  };

  const handleSaveFrame = (frame: SpectacleFrame) => {
    if (editingFrame) {
      // Update existing
      setFrames(prev => prev.map(f => f.id === frame.id ? frame : f));
      setEditingFrame(null);
    } else {
      // Add new
      setFrames(prev => [frame, ...prev]);
    }
    // Switch to list view (either inventory or marketplace depending on saved item)
    if (frame.category === 'marketplace') {
      setActiveTab('marketplace');
    } else {
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
      message: 'ATENÇÃO: Você está prestes a apagar TODOS os óculos (Inventário e Marketplace). Isso não poderá ser revertido. Deseja continuar?',
      action: () => {
        setFrames([]);
      }
    });
  };

  const handleToggleStatus = (frame: SpectacleFrame) => {
     const updatedFrame = { ...frame, isSold: !frame.isSold };
     setFrames(prev => prev.map(f => f.id === frame.id ? updatedFrame : f));
  };

  const handleEditFrame = (frame: SpectacleFrame) => {
    setEditingFrame(frame);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Updated Logic: Create a copy for marketplace
  const handleCreateMarketplaceListing = (originalFrame: SpectacleFrame, newPrice: number) => {
    const marketplaceCopy: SpectacleFrame = {
      ...originalFrame,
      id: uuidv4(), // New Unique ID
      storePrice: newPrice, // The calculated price becomes the 'store price' for the marketplace item
      category: 'marketplace', // Explicitly set category
      isSold: false, // Reset sold status just in case
      createdAt: Date.now()
    };

    setFrames(prev => [marketplaceCopy, ...prev]);
    alert(`Cópia criada com sucesso na aba Mercado Livre! Preço: ${newPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    setActiveTab('marketplace');
  };

  const handleCancelEdit = () => {
    setEditingFrame(null);
  };

  const handlePrint = () => {
    // Timeout helps prevent race conditions with browser event loop in some environments
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Filter logic for Search
  const getFilteredFrames = () => {
    if (!searchTerm.trim()) return frames;
    
    const lowerTerm = searchTerm.toLowerCase();
    return frames.filter(frame => 
      (frame.name && frame.name.toLowerCase().includes(lowerTerm)) ||
      frame.brand.toLowerCase().includes(lowerTerm) || 
      frame.modelCode.toLowerCase().includes(lowerTerm) || 
      (frame.colorCode && frame.colorCode.toLowerCase().includes(lowerTerm)) ||
      (frame.ean && frame.ean.includes(lowerTerm))
    );
  };

  // Categorized Lists
  const inventoryFrames = frames.filter(f => f.category === 'inventory');
  const marketplaceFrames = frames.filter(f => f.category === 'marketplace');

  // Determine what to print based on active tab
  const framesToPrint = activeTab === 'marketplace' ? marketplaceFrames : inventoryFrames;
  const printTitle = activeTab === 'marketplace' ? 'Relatório Mercado Livre' : 'Relatório de Inventário';

  // Helper for view toggles rendered inline to avoid re-definition issues
  const renderViewToggle = () => (
    <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center gap-1 shadow-sm">
       <button 
          type="button"
          onClick={() => setViewMode('grid')}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50'}`}
          title="Visualização em Cartões"
       >
          <i className="fas fa-th"></i>
       </button>
       <button 
          type="button"
          onClick={() => setViewMode('list')}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-50'}`}
          title="Visualização em Lista"
       >
          <i className="fas fa-list"></i>
       </button>
    </div>
  );

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 print:hidden">
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

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Section - Click to Home */}
          <div className="cursor-pointer select-none" onClick={() => setActiveTab('home')}>
             <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-wider font-brand uppercase">
              Gerenciador Comercial
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors border border-brand-100 hidden sm:flex"
              title="Importar Arquivos (PDF, Excel, CSV)"
            >
              <i className="fas fa-file-import"></i>
              <span>Importar</span>
            </button>
            <button 
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors border border-brand-100 sm:hidden"
              title="Importar"
            >
              <i className="fas fa-file-import"></i>
            </button>
            
            {/* Mercado Livre Button */}
            <button 
              type="button"
              onClick={() => {
                setActiveTab('marketplace');
                handleCancelEdit(); 
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors border ml-2 ${
                activeTab === 'marketplace' 
                  ? 'bg-[#ffe600] text-[#2d3277] border-[#e5ce00] ring-2 ring-[#ffe600]/50 shadow-md'
                  : 'bg-white text-[#2d3277] border-slate-200 hover:bg-[#fff9c2]'
              }`}
              title="Ver Mercado Livre"
            >
              <img 
                src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadolibre/logo__small.png" 
                alt="Logo ML" 
                className="h-6 w-auto object-contain"
              />
              <span className="hidden md:inline">Mercado Livre</span>
              {marketplaceFrames.length > 0 && (
                 <span className="bg-[#2d3277] text-white text-xs py-0.5 px-1.5 rounded-full ml-1">
                   {marketplaceFrames.length}
                 </span>
              )}
            </button>

            {/* Logout Button */}
            <button
               onClick={handleLogout}
               className="w-10 h-10 ml-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
               title="Sair"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          
          {/* Tabs Navigation */}
          <div className="flex justify-center">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex relative flex-wrap justify-center gap-1">
               <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`relative z-10 px-3 md:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'home' 
                    ? 'bg-brand-50 text-brand-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-home"></i>
                <span className="hidden md:inline">Início</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`relative z-10 px-3 md:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'register' 
                    ? 'bg-brand-50 text-brand-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className={`fas ${editingFrame ? 'fa-pen' : 'fa-plus-circle'}`}></i>
                <span className="hidden md:inline">{editingFrame ? 'Editar' : 'Novo Registro'}</span>
                <span className="md:hidden">Novo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('list');
                  handleCancelEdit(); 
                }}
                className={`relative z-10 px-3 md:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'list' 
                    ? 'bg-brand-50 text-brand-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-box"></i>
                <span className="hidden md:inline">Inventário</span>
                <span className="ml-1 bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">
                  {inventoryFrames.length}
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`relative z-10 px-3 md:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'pricing' 
                    ? 'bg-brand-50 text-brand-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className="fas fa-calculator"></i>
                <span className="hidden md:inline">Precificador</span>
                <span className="md:hidden">Preço</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="transition-all duration-300">
            
            {/* --- HOME TAB --- */}
            {activeTab === 'home' && (
              <div className="animate-fadeIn flex flex-col items-center">
                 <div className="w-full max-w-2xl text-center mb-10 mt-4">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2 font-brand">Buscar Óculos</h2>
                    <p className="text-slate-500 mb-6">Localize rapidamente por Marca, Código do Modelo, Cor ou EAN.</p>
                    
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                        <i className="fas fa-search text-lg"></i>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Digite para buscar..." 
                        className="w-full py-4 pl-12 pr-4 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition-all text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                    </div>
                 </div>

                 <div className="w-full">
                    {searchTerm ? (
                       <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Resultados da Busca</h3>
                          <FrameList 
                            frames={getFilteredFrames()} 
                            viewMode={viewMode}
                            onEdit={handleEditFrame}
                            onDelete={handleDeleteFrame} 
                            onToggleStatus={handleToggleStatus}
                          />
                       </div>
                    ) : (
                       <div className="mt-4">
                          {frames.length > 0 ? (
                             <>
                               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                 <i className="fas fa-clock"></i> Últimos Registros
                               </h3>
                               <FrameList 
                                  frames={frames.slice(0, 3)}
                                  viewMode={viewMode} 
                                  onEdit={handleEditFrame}
                                  onDelete={handleDeleteFrame} 
                                  onToggleStatus={handleToggleStatus}
                                />
                             </>
                          ) : (
                            <div className="text-center py-12 opacity-60">
                               <i className="fas fa-inbox text-4xl text-slate-300 mb-3"></i>
                               <p>Nenhum registro encontrado. Comece cadastrando um novo óculos.</p>
                            </div>
                          )}
                       </div>
                    )}
                 </div>
              </div>
            )}

            {/* --- REGISTER TAB --- */}
            {activeTab === 'register' && (
              <div className="animate-fadeIn">
                <FrameForm 
                  initialData={editingFrame || undefined} 
                  onSave={handleSaveFrame} 
                  onCancel={editingFrame ? handleCancelEdit : undefined}
                />
              </div>
            )}

            {/* --- LIST TAB (INVENTORY) --- */}
            {activeTab === 'list' && (
              <div className="animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-slate-800 font-brand flex items-center gap-2">
                    <i className="fas fa-box text-brand-600"></i> Inventário da Loja
                  </h2>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={handlePrint}
                      className="text-sm text-slate-600 hover:text-brand-600 transition-colors px-3 py-1 hover:bg-slate-50 rounded-lg border border-slate-200 bg-white"
                      title="Imprimir Lista"
                    >
                      <i className="fas fa-print mr-1"></i> Imprimir
                    </button>
                    {renderViewToggle()}
                    {inventoryFrames.length > 0 && (
                      <button 
                        type="button"
                        onClick={handleClearAll}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors px-3 py-1 hover:bg-red-50 rounded-lg"
                      >
                        <i className="fas fa-trash-alt mr-1"></i> Limpar Tudo
                      </button>
                    )}
                  </div>
                </div>
                <FrameList 
                  frames={inventoryFrames} 
                  viewMode={viewMode}
                  onEdit={handleEditFrame}
                  onDelete={handleDeleteFrame} 
                  onToggleStatus={handleToggleStatus}
                />
              </div>
            )}

            {/* --- MERCADO LIVRE TAB --- */}
            {activeTab === 'marketplace' && (
              <div className="animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-[#2d3277] font-brand flex items-center gap-2">
                     <img 
                        src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadolibre/logo__small.png" 
                        alt="Logo ML" 
                        className="h-6 w-auto object-contain"
                      />
                     Anúncios Mercado Livre
                  </h2>
                  <div className="flex items-center gap-3">
                     <button 
                      type="button"
                      onClick={handlePrint}
                      className="text-sm text-slate-600 hover:text-brand-600 transition-colors px-3 py-1 hover:bg-slate-50 rounded-lg border border-slate-200 bg-white"
                      title="Imprimir Lista"
                    >
                      <i className="fas fa-print mr-1"></i> Imprimir
                    </button>
                    {renderViewToggle()}
                    {marketplaceFrames.length > 0 && (
                      <button 
                        type="button"
                        onClick={handleClearAll}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors px-3 py-1 hover:bg-red-50 rounded-lg"
                      >
                        <i className="fas fa-trash-alt mr-1"></i> Limpar Tudo
                      </button>
                    )}
                  </div>
                </div>
                
                {marketplaceFrames.length === 0 ? (
                   <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100 border-dashed">
                      <i className="fas fa-handshake text-4xl text-[#ffe600] mb-4 drop-shadow-sm"></i>
                      <p className="text-slate-500 font-medium">Nenhum item no Mercado Livre ainda.</p>
                      <p className="text-slate-400 text-sm">Use o <strong>Precificador</strong> para gerar cópias do inventário para vendas online.</p>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('pricing')}
                        className="mt-4 px-4 py-2 text-[#2d3277] bg-[#ffe600] rounded-lg text-sm font-bold hover:bg-[#ffe600]/80 shadow-sm"
                      >
                        Ir para Precificador
                      </button>
                   </div>
                ) : (
                  <FrameList 
                    frames={marketplaceFrames} 
                    viewMode={viewMode}
                    onEdit={handleEditFrame}
                    onDelete={handleDeleteFrame} 
                    onToggleStatus={handleToggleStatus}
                  />
                )}
              </div>
            )}

            {/* --- PRICING TAB --- */}
            {activeTab === 'pricing' && (
              <PricingTab 
                frames={frames} 
                onCreateCopy={handleCreateMarketplaceListing} 
              />
            )}
          </div>

        </div>
      </main>
    </div>

    {/* PRINT TEMPLATE (Hidden unless printing) */}
    <div className="hidden print:block bg-white p-8 font-sans text-black">
      <div className="flex justify-between items-center mb-6 border-b border-black pb-4">
         <h1 className="text-3xl font-bold font-brand uppercase tracking-wider">Gerenciador Comercial</h1>
         <div className="text-right">
            <h2 className="text-xl font-bold uppercase">{printTitle}</h2>
            <p className="text-sm text-gray-600">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
         </div>
      </div>

      <table className="w-full text-sm text-left border-collapse">
         <thead>
            <tr className="border-b-2 border-black">
               <th className="py-2 px-1 w-16">IMG</th>
               <th className="py-2 px-2">MARCA</th>
               <th className="py-2 px-2">MODELO</th>
               <th className="py-2 px-2">COR</th>
               <th className="py-2 px-2">TAM</th>
               <th className="py-2 px-2">EAN</th>
               <th className="py-2 px-2 text-right">VALOR ({activeTab === 'marketplace' ? 'VENDA' : 'CUSTO'})</th>
               <th className="py-2 px-2 text-center">STATUS</th>
            </tr>
         </thead>
         <tbody>
            {framesToPrint.map((frame, index) => (
               <tr key={frame.id} className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="py-2 px-1">
                     {frame.images && frame.images.length > 0 ? (
                        <img src={frame.images[0]} className="w-10 h-10 object-cover border border-gray-200" alt="" />
                     ) : (
                        <div className="w-10 h-10 bg-gray-100 border border-gray-200"></div>
                     )}
                  </td>
                  <td className="py-2 px-2 font-bold">{frame.brand}</td>
                  <td className="py-2 px-2">{frame.modelCode}</td>
                  <td className="py-2 px-2">{frame.colorCode}</td>
                  <td className="py-2 px-2">{frame.size}</td>
                  <td className="py-2 px-2 font-mono text-xs">{frame.ean}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold">
                     {(activeTab === 'marketplace' ? frame.storePrice : frame.purchasePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-2 px-2 text-center">
                     {frame.isSold ? (
                        <span className="text-red-600 font-bold uppercase text-xs border border-red-600 px-1">Vendido</span>
                     ) : (
                        <span className="text-green-800 text-xs">Disp.</span>
                     )}
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
      
      <div className="mt-8 text-right text-xs text-gray-500 border-t pt-2">
         <p>Total de Registros: {framesToPrint.length}</p>
      </div>
    </div>
    </>
  );
};

export default App;