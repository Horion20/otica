import React, { useState, useEffect } from 'react';
import { SpectacleFrame } from '../types';

interface PricingTabProps {
  frames: SpectacleFrame[];
  onMoveToMarketplace: (frame: SpectacleFrame, newPrice: number, target: 'mercadolivre' | 'shopee' | 'amazon' | 'all') => void;
}

export const PricingTab: React.FC<PricingTabProps> = ({ frames, onMoveToMarketplace }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFrame, setSelectedFrame] = useState<SpectacleFrame | null>(null);
  
  // Strategy 1: Percentage Adder (Taxa da Loja)
  const [percentage, setPercentage] = useState<number>(10); 
  
  // Shipping Cost (Frete Manual) - Default 26.94, but editable
  const [shippingCost, setShippingCost] = useState<number>(26.94);

  // Strategy 2: Markup Multiplier
  const [markup, setMarkup] = useState<number>(2.0);
  const MARKUP_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5];

  // Filter frames to only show Inventory items AND items not yet processed for marketplace
  const filteredFrames = frames.filter(frame => {
    if (frame.category !== 'inventory') return false;
    
    // If the item has already been sent to a marketplace, hide it from this list
    if (frame.hasMarketplaceListing) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (frame.name && frame.name.toLowerCase().includes(term)) ||
      frame.brand.toLowerCase().includes(term) ||
      frame.modelCode.toLowerCase().includes(term) ||
      frame.ean?.includes(term)
    );
  });

  // Reset selection validation
  useEffect(() => {
    if (selectedFrame && !frames.find(f => f.id === selectedFrame.id)) {
      setSelectedFrame(null);
    }
  }, [frames, selectedFrame]);

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- CALCULATION LOGIC ---
  // Formula: (Cost * Markup) + ((Cost * Markup) * Percentage) + Shipping
  
  const costPrice = selectedFrame?.purchasePrice || 0;
  const markupValue = costPrice * markup;
  const percentageAddon = markupValue * (percentage / 100);
  const calculatedPrice = markupValue + percentageAddon + shippingCost;

  const handleMove = (target: 'mercadolivre' | 'shopee' | 'amazon' | 'all') => {
    if (selectedFrame) {
      onMoveToMarketplace(selectedFrame, calculatedPrice, target);
      // Deselect after moving to allow quick selection of next item
      setSelectedFrame(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col md:flex-row animate-fadeIn transition-colors">
      
      {/* Sidebar: Search & List */}
      <div className="w-full md:w-1/3 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h3 className="font-brand font-bold text-slate-700 dark:text-slate-300 mb-3">Selecionar do Inventário</h3>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
            <input
              type="text"
              placeholder="Buscar no inventário..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 focus:border-brand-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredFrames.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm px-4">
              {searchTerm ? 'Nenhum óculos encontrado.' : 'Todos os itens do inventário já foram processados.'}
            </div>
          ) : (
            filteredFrames.map(frame => (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${
                  selectedFrame?.id === frame.id
                    ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800 ring-1 ring-brand-200 dark:ring-brand-800'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-100 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                  {frame.images && frame.images.length > 0 ? (
                    <img src={frame.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                      <i className="fas fa-glasses text-xs"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedFrame?.id === frame.id ? 'text-brand-800 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {frame.name || frame.modelCode}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{frame.brand}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Custo</p>
                   <p className="text-xs font-medium text-slate-600 dark:text-slate-400">R$ {frame.purchasePrice?.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Calculator */}
      <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col bg-white dark:bg-slate-800 relative transition-colors">
        {!selectedFrame ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 opacity-60">
            <i className="fas fa-calculator text-6xl mb-4"></i>
            <p className="text-lg font-medium text-slate-400 dark:text-slate-500">Selecione um óculos na lista para calcular</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-lg mx-auto w-full animate-fadeIn">
            
            {/* Header Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
               <div className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 overflow-hidden shadow-sm">
                  {selectedFrame.images && selectedFrame.images.length > 0 ? (
                    <img src={selectedFrame.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                      <i className="fas fa-glasses text-2xl"></i>
                    </div>
                  )}
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white font-brand">{selectedFrame.name}</h2>
                 <p className="text-slate-500 dark:text-slate-400">{selectedFrame.brand} • {selectedFrame.modelCode}</p>
                 <div className="flex gap-3 mt-2">
                    <span className="text-xs px-2 py-1 rounded border bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300 font-bold">
                        Custo: <strong>{formatMoney(selectedFrame.purchasePrice || 0)}</strong>
                    </span>
                 </div>
               </div>
            </div>

            {/* Controls Area */}
            <div className="space-y-8">
              
              {/* 1. MARKUP SELECTOR */}
              <div className="animate-fadeIn">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 block flex items-center gap-2">
                   <span className="w-5 h-5 bg-slate-800 dark:bg-slate-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                   Multiplicador (Markup)
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {MARKUP_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setMarkup(opt)}
                            className={`py-3 rounded-xl font-bold text-lg border transition-all ${
                                markup === opt
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200 dark:shadow-none'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-slate-600'
                            }`}
                        >
                            {opt.toFixed(1)}x
                        </button>
                    ))}
                </div>
              </div>

              {/* 2. PERCENTAGE SLIDER (TAXA DA LOJA) */}
              <div className="animate-fadeIn">
                <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-5 h-5 bg-slate-800 dark:bg-slate-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                        Taxa da Loja (%)
                    </label>
                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-lg border border-brand-100 dark:border-brand-800">
                        {percentage}%
                    </span>
                </div>
                
                <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    step="1"
                    value={percentage} 
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600 dark:accent-brand-500 hover:accent-brand-500 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
                 
                  {/* Base (Cost * Markup) */}
                  <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Base (Custo × {markup}x)</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatMoney(markupValue)}</span>
                  </div>

                  {/* Percentage Addition (Taxa da Loja) */}
                  <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <i className="fas fa-plus text-[10px]"></i> Taxa da Loja ({percentage}%)
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatMoney(percentageAddon)}
                      </span>
                  </div>

                  {/* Shipping (EDITABLE) */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-600 border-dashed">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <i className="fas fa-plus text-[10px]"></i> Frete (R$)
                      </span>
                      <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">R$</span>
                          <input
                            type="number"
                            value={shippingCost}
                            onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                            className="w-20 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-1 text-sm font-bold text-orange-600 dark:text-orange-400 text-right focus:outline-none focus:ring-1 focus:ring-orange-300"
                          />
                      </div>
                  </div>
                 
                 {/* Total */}
                 <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-slate-800 dark:text-white uppercase">Preço Final</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            (Base + Taxa + Frete)
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-brand-700 dark:text-brand-400 tracking-tight leading-none">
                            {formatMoney(calculatedPrice)}
                        </span>
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                  <button
                    onClick={() => handleMove('all')}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-globe"></i>
                    Registrar em Todos (Clone)
                  </button>
                  
                  <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleMove('mercadolivre')}
                        className="py-3 bg-[#ffe600] text-[#2d3277] rounded-xl font-bold hover:bg-[#ffe600]/80 transition-all active:scale-[0.98] shadow-sm flex flex-col items-center justify-center gap-1 text-sm leading-tight"
                      >
                        <i className="fas fa-handshake"></i>
                        Mercado Livre
                      </button>

                      <button
                        onClick={() => handleMove('shopee')}
                        className="py-3 bg-[#ee4d2d] text-white rounded-xl font-bold hover:bg-[#d03e1f] transition-all active:scale-[0.98] shadow-sm flex flex-col items-center justify-center gap-1 text-sm leading-tight"
                      >
                        <i className="fas fa-shopping-bag"></i>
                        Shopee
                      </button>

                      <button
                        onClick={() => handleMove('amazon')}
                        className="py-3 bg-[#232f3e] text-white rounded-xl font-bold hover:bg-[#131921] transition-all active:scale-[0.98] shadow-sm flex flex-col items-center justify-center gap-1 text-sm leading-tight"
                      >
                        <i className="fab fa-amazon"></i>
                        Amazon
                      </button>
                  </div>
              </div>
              
              <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
                "Registrar em Todos" cria cópias independentes do item para cada plataforma.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};