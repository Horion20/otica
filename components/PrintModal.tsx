import React, { useState, useMemo, useEffect } from 'react';
import { SpectacleFrame } from '../types';
import { generateFramesPDF } from '../services/pdfGenerator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: SpectacleFrame[];
  title: string;
  category: 'inventory' | 'marketplace' | 'sold';
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, frames, title, category }) => {
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'sun' | 'optical'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('available');

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilterBrand('');
      setFilterType('all');
      // Default to 'available' if coming from inventory/ML to keep view clean,
      // but if coming from 'sold' tab, default to 'sold'.
      setFilterStatus(category === 'sold' ? 'sold' : 'available');
    }
  }, [isOpen, category]);

  // Extract unique brands for the dropdown
  const uniqueBrands = useMemo(() => {
    const brands = new Set(frames.map(f => f.brand));
    return Array.from(brands).sort();
  }, [frames]);

  // Filter Logic
  const filteredFrames = useMemo(() => {
    return frames.filter(frame => {
      // 1. Brand Filter
      if (filterBrand && frame.brand !== filterBrand) {
        return false;
      }

      // 2. Type Filter (Heuristic)
      // Solar: Has lensColor OR isPolarized
      // Optical: No lensColor AND not Polarized
      const isSun = (frame.lensColor && frame.lensColor.trim() !== '') || frame.isPolarized;
      
      if (filterType === 'sun' && !isSun) return false;
      if (filterType === 'optical' && isSun) return false;

      // 3. Status Filter (Available/Sold)
      if (filterStatus === 'available' && frame.isSold) return false;
      if (filterStatus === 'sold' && !frame.isSold) return false;

      return true;
    });
  }, [frames, filterBrand, filterType, filterStatus]);

  if (!isOpen) return null;

  const handleSavePDF = () => {
    try {
        const doc = generateFramesPDF(filteredFrames, title, category);
        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
        alert("Erro ao gerar PDF. Verifique se o navegador bloqueou o download.");
        console.error(e);
    }
  };

  const handlePrint = () => {
    try {
        const doc = generateFramesPDF(filteredFrames, title, category);
        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob, '_blank');
    } catch (e) {
        alert("Erro ao abrir janela de impressão.");
        console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-print text-brand-600"></i>
              Imprimir Relatório
            </h2>
            <p className="text-sm text-slate-500 mt-1">{title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content Preview & Filters */}
        <div className="p-6 space-y-6 overflow-y-auto">
           
           {/* Filters Section */}
           <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-filter"></i> Filtrar Itens
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 {/* Brand Filter */}
                 <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 font-bold mb-1">MARCA</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-brand-200 outline-none appearance-none"
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                      >
                        <option value="">Todas as Marcas</option>
                        {uniqueBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    </div>
                 </div>

                 {/* Status Filter */}
                 <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 font-bold mb-1">STATUS (ESTOQUE)</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-brand-200 outline-none appearance-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                      >
                        <option value="available">Disponíveis (Em Estoque)</option>
                        <option value="sold">Vendidos / Esgotados</option>
                        <option value="all">Todos (Histórico Completo)</option>
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    </div>
                 </div>

                 {/* Type Filter */}
                 <div className="flex flex-col col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold mb-1">TIPO (SOL / GRAU)</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-brand-200 outline-none appearance-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                      >
                        <option value="all">Todos</option>
                        <option value="sun">Solar (Com Lente)</option>
                        <option value="optical">Grau (Sem Lente)</option>
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    </div>
                 </div>
              </div>
           </div>

           {/* Stats Row */}
           <div className="flex items-center justify-between">
              <div className="bg-brand-50 rounded-lg px-4 py-2 border border-brand-100 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                    {filteredFrames.length}
                 </div>
                 <p className="text-xs text-brand-800 font-bold uppercase tracking-wider">Itens Selecionados</p>
              </div>
           </div>

           {/* List Preview */}
           <div className="border rounded-xl overflow-hidden flex flex-col h-64">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 uppercase flex justify-between flex-shrink-0">
                <span>Pré-visualização</span>
                <span>{filteredFrames.length} de {frames.length}</span>
              </div>
              <div className="overflow-y-auto bg-white divide-y divide-slate-100 flex-1">
                 {filteredFrames.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <i className="fas fa-search mb-2 text-2xl opacity-50"></i>
                      <p className="text-sm">Nenhum item corresponde aos filtros.</p>
                   </div>
                 ) : (
                   filteredFrames.map(frame => (
                     <div key={frame.id} className="px-4 py-2 flex justify-between items-center text-sm hover:bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                           <span className={`w-2 h-2 rounded-full flex-shrink-0 ${frame.isSold ? 'bg-red-400' : 'bg-green-400'}`}></span>
                           <span className={`truncate pr-2 font-medium ${frame.isSold ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                             {frame.brand} <span className="text-slate-500 font-normal">{frame.modelCode}</span>
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           {/* Icon indicator for Type */}
                           {((frame.lensColor && frame.lensColor.trim() !== '') || frame.isPolarized) ? (
                              <i className="fas fa-sun text-orange-400 text-xs" title="Solar"></i>
                           ) : (
                              <i className="fas fa-glasses text-blue-400 text-xs" title="Grau"></i>
                           )}
                           <span className="font-mono text-xs text-slate-400 ml-2">
                             {(category === 'marketplace' ? frame.storePrice : frame.purchasePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </span>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
          <button 
            onClick={handleSavePDF}
            disabled={filteredFrames.length === 0}
            className="flex-1 py-4 bg-white border-2 border-slate-200 hover:border-brand-500 hover:text-brand-600 text-slate-600 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-1 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-file-pdf text-xl mb-1 group-hover:scale-110 transition-transform"></i>
            <span>Salvar PDF</span>
            <span className="text-[10px] font-normal text-slate-400">Baixar para o computador</span>
          </button>

          <button 
            onClick={handlePrint}
            disabled={filteredFrames.length === 0}
            className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <i className="fas fa-print text-xl mb-1"></i>
            <span>Imprimir</span>
            <span className="text-[10px] font-normal text-brand-200 opacity-80">Enviar para impressora</span>
          </button>
        </div>

      </div>
    </div>
  );
};