import React, { useState, useEffect } from 'react';
import { SpectacleFrame } from '../types';

interface PricingTabProps {
  frames: SpectacleFrame[];
  onCreateCopy: (frame: SpectacleFrame, newPrice: number) => void;
}

export const PricingTab: React.FC<PricingTabProps> = ({ frames, onCreateCopy }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFrame, setSelectedFrame] = useState<SpectacleFrame | null>(null);
  
  // Strategy 1: Percentage Adder
  const [percentage, setPercentage] = useState<number>(10); 
  const SHIPPING_COST = 26.94;

  // Strategy 2: Markup Multiplier
  const [markup, setMarkup] = useState<number>(2.0);
  const MARKUP_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5];

  // Filter frames to only show Inventory items
  const filteredFrames = frames.filter(frame => {
    if (frame.category !== 'inventory') return false;

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
  const calculatedPrice = markupValue + percentageAddon + SHIPPING_COST;

  const handleCreateCopy = () => {
    if (selectedFrame) {
      onCreateCopy(selectedFrame, calculatedPrice);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col md:flex-row animate-fadeIn">
      
      {/* Sidebar: Search & List */}
      <div className="w-full md:w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h3 className="font-brand font-bold text-slate-700 mb-3">Selecionar do Inventário</h3>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Buscar no inventário..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredFrames.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm px-4">
              {searchTerm ? 'Nenhum óculos encontrado.' : 'Nenhum item no inventário para exibir.'}
            </div>
          ) : (
            filteredFrames.map(frame => (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${
                  selectedFrame?.id === frame.id
                    ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200'
                    : 'bg-white border-slate-100 hover:border-brand-100 hover:bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                  {frame.images && frame.images.length > 0 ? (
                    <img src={frame.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <i className="fas fa-glasses text-xs"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedFrame?.id === frame.id ? 'text-brand-800' : 'text-slate-700'}`}>
                    {frame.name || frame.modelCode}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{frame.brand}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-400 uppercase">Custo</p>
                   <p className="text-xs font-medium text-slate-600">R$ {frame.purchasePrice?.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Calculator */}
      <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col bg-white relative">
        {!selectedFrame ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-60">
            <i className="fas fa-calculator text-6xl mb-4"></i>
            <p className="text-lg font-medium">Selecione um óculos na lista para calcular</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-lg mx-auto w-full animate-fadeIn">
            
            {/* Header Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
               <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm">
                  {selectedFrame.images && selectedFrame.images.length > 0 ? (
                    <img src={selectedFrame.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <i className="fas fa-glasses text-2xl"></i>
                    </div>
                  )}
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800 font-brand">{selectedFrame.name}</h2>
                 <p className="text-slate-500">{selectedFrame.brand} • {selectedFrame.modelCode}</p>
                 <div className="flex gap-3 mt-2">
                    <span className="text-xs px-2 py-1 rounded border bg-brand-50 border-brand-200 text-brand-800 font-bold">
                        Custo: <strong>{formatMoney(selectedFrame.purchasePrice || 0)}</strong>
                    </span>
                 </div>
               </div>
            </div>

            {/* Controls Area */}
            <div className="space-y-8">
              
              {/* 1. MARKUP SELECTOR */}
              <div className="animate-fadeIn">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 block flex items-center gap-2">
                   <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">1</span>
                   Multiplicador (Markup)
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {MARKUP_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setMarkup(opt)}
                            className={`py-3 rounded-xl font-bold text-lg border transition-all ${
                                markup === opt
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                            }`}
                        >
                            {opt.toFixed(1)}x
                        </button>
                    ))}
                </div>
              </div>

              {/* 2. PERCENTAGE SLIDER */}
              <div className="animate-fadeIn">
                <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">2</span>
                        Acréscimo (%)
                    </label>
                    <span className="text-2xl font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">
                        {percentage}%
                    </span>
                </div>
                
                <input 
                    type="range" 
                    min="1" 
                    max="25" 
                    step="1"
                    value={percentage} 
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 hover:accent-brand-500 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>1%</span>
                    <span>12%</span>
                    <span>25%</span>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-300">
                 
                  {/* Base (Cost * Markup) */}
                  <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-slate-500">Base (Custo × {markup}x)</span>
                      <span className="text-sm font-bold text-slate-700">{formatMoney(markupValue)}</span>
                  </div>

                  {/* Percentage Addition */}
                  <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                          <i className="fas fa-plus text-[10px]"></i> {percentage}% Acréscimo
                      </span>
                      <span className="text-sm font-bold text-green-600">
                          {formatMoney(percentageAddon)}
                      </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 border-dashed">
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                          <i className="fas fa-plus text-[10px]"></i> Frete Fixo
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                          {formatMoney(SHIPPING_COST)}
                      </span>
                  </div>
                 
                 {/* Total */}
                 <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-slate-800 uppercase">Preço Final</span>
                        <span className="text-[10px] text-slate-400">
                            (Base + % + Frete)
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-brand-700 tracking-tight leading-none">
                            {formatMoney(calculatedPrice)}
                        </span>
                    </div>
                 </div>
              </div>

              {/* Action */}
              <button
                onClick={handleCreateCopy}
                className="w-full py-4 bg-[#ffe600] text-[#2d3277] rounded-xl font-bold text-lg hover:bg-[#ffe600]/80 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                <i className="fas fa-copy"></i>
                Gerar Cópia Mercado Livre
              </button>
              
              <p className="text-xs text-center text-slate-400 mt-2">
                Cria um novo anúncio na aba Mercado Livre.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};