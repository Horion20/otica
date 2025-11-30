import React, { useState } from 'react';
import { SpectacleFrame, UserRole } from '../types';

interface FrameListProps {
  frames: SpectacleFrame[];
  onDelete: (id: string) => void;
  onEdit: (frame: SpectacleFrame) => void;
  onToggleStatus: (frame: SpectacleFrame) => void;
  onPhysicalSale: (frame: SpectacleFrame) => void; 
  onViewSale?: (frame: SpectacleFrame) => void; // New prop for viewing sales details
  userRole?: UserRole;
  currentCategory?: string;
}

// Internal component to handle Brand display (Text Badge only)
const BrandBadge: React.FC<{ brand: string }> = ({ brand }) => {
  return (
    <span className="inline-block px-2 py-0.5 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-[10px] font-bold rounded uppercase tracking-wide border border-brand-100 dark:border-brand-800 whitespace-nowrap">
      {brand}
    </span>
  );
};

// Internal Helper for Platform Icon/Name
const PlatformBadge: React.FC<{ platform?: string }> = ({ platform }) => {
  if (!platform) return null;

  let icon = 'fa-check-circle';
  let color = 'text-slate-500';
  let label = 'Vendido';
  let bgColor = 'bg-slate-100 dark:bg-slate-700';

  if (platform === 'mercadolivre') {
    icon = 'fa-handshake';
    color = 'text-[#2d3277]';
    label = 'Mercado Livre';
    bgColor = 'bg-[#ffe600]';
  } else if (platform === 'shopee') {
    icon = 'fa-shopping-bag';
    color = 'text-white';
    label = 'Shopee';
    bgColor = 'bg-[#ee4d2d]';
  } else if (platform === 'amazon') {
    icon = 'fa-amazon';
    color = 'text-white';
    label = 'Amazon';
    bgColor = 'bg-[#232f3e]';
  } else if (platform === 'inventory') {
     icon = 'fa-store';
     label = 'Loja Física';
     bgColor = 'bg-slate-200 dark:bg-slate-700';
     color = 'text-slate-700 dark:text-slate-300';
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${bgColor} ${color} border border-black/5`}>
       <i className={`fas ${icon} ${platform === 'amazon' ? 'fab' : ''}`}></i>
       {label}
    </div>
  );
};

// Internal Row Component (List View)
const FrameRow: React.FC<{
  frame: SpectacleFrame;
  onDelete: (id: string) => void;
  onEdit: (frame: SpectacleFrame) => void;
  onToggleStatus: (frame: SpectacleFrame) => void;
  onPhysicalSale: (frame: SpectacleFrame) => void;
  onViewSale?: (frame: SpectacleFrame) => void;
  onZoom: (images: string[], initialIndex: number) => void;
  userRole?: UserRole;
  currentCategory?: string;
}> = ({ frame, onDelete, onEdit, onToggleStatus, onPhysicalSale, onViewSale, onZoom, userRole, currentCategory }) => {
  const canEdit = userRole !== 'Visitante';

  const formatMoney = (val: number) => {
    return val ? `R$ ${val.toFixed(2).replace('.', ',')}` : '-';
  };
  
  const images = frame.images && frame.images.length > 0 ? frame.images : [];
  const hasImages = images.length > 0;
  
  // Decide which price to show based on Category
  const isMarketplace = ['marketplace', 'mercadolivre', 'shopee', 'amazon'].includes(frame.category);
  const priceLabel = isMarketplace ? 'PREÇO' : 'CUSTO';
  const priceValue = isMarketplace ? frame.storePrice : frame.purchasePrice;

  // Determine Main Sell Button Tooltip
  let sellTooltip = "Vender";
  if (!frame.isSold) {
      if (['mercadolivre', 'shopee', 'amazon'].includes(currentCategory || '')) {
          sellTooltip = `Vender em ${currentCategory} (1 un)`;
      } else {
          sellTooltip = "Registrar Venda";
      }
  } else {
      sellTooltip = "Marcar como Disponível (Restaurar)";
  }

  const soldDate = frame.soldAt ? new Date(frame.soldAt).toLocaleString('pt-BR') : '';

  const handleRowClick = () => {
    if (frame.isSold && onViewSale) {
        onViewSale(frame);
    } else {
        onEdit(frame);
    }
  };

  return (
    <div 
        className={`p-3 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group ${frame.isSold ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800'}`}
        onClick={handleRowClick}
    >
       {/* Image */}
       <div 
         className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0 overflow-hidden relative"
         onClick={(e) => { e.stopPropagation(); if(hasImages) onZoom(images, 0); }}
       >
         {hasImages ? (
            <img src={images[0]} alt={frame.name} className={`w-full h-full object-cover ${frame.isSold ? 'grayscale opacity-70' : ''}`} />
         ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
              <i className="fas fa-glasses text-xs"></i>
            </div>
         )}
         {frame.isPolarized && (
             <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[6px] text-center uppercase">Pol</div>
         )}
       </div>

       {/* Info */}
       <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <h3 className={`text-sm font-bold truncate ${frame.isSold ? 'text-red-700 dark:text-red-300 line-through decoration-red-400' : 'text-slate-800 dark:text-white'}`}>
                {frame.name || frame.modelCode}
             </h3>
             {frame.isSold && (
                <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">ESGOTADO</span>
             )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <BrandBadge brand={frame.brand} />
            {frame.colorCode && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600">
                <i className="fas fa-palette"></i>
                <span>{frame.colorCode}</span>
              </div>
            )}
            {/* Quantity Badge - Shows 0 and Red if sold */}
            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${frame.quantity === 0 || frame.isSold ? 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-900/50' : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                <i className="fas fa-layer-group"></i>
                <span>{frame.quantity}</span>
            </div>
            
            {/* Sold Platform Badge Row View */}
            {frame.isSold && frame.soldPlatform && (
                <PlatformBadge platform={frame.soldPlatform} />
            )}
            {frame.isSold && soldDate && (
                <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium opacity-80">
                    <i className="far fa-clock"></i>
                    <span>{soldDate}</span>
                </div>
            )}
          </div>
       </div>

       {/* Actions & Price */}
       <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
             <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">{priceLabel}</span>
             <span className={`text-sm font-bold ${frame.isSold ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
               {formatMoney(priceValue)}
             </span>
          </div>
          
          {/* Mini Actions */}
          {canEdit && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-100 dark:border-slate-700">
               {/* Physical Sale Button (Only if NOT sold) */}
               {!frame.isSold && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); onPhysicalSale(frame); }}
                     className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                     title="Venda Física"
                   >
                     <i className="fas fa-cash-register text-[10px]"></i>
                   </button>
               )}
               <button 
                  onClick={(e) => { e.stopPropagation(); onToggleStatus(frame); }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${frame.isSold ? 'text-red-500 bg-red-100 dark:bg-red-900/40 hover:bg-red-200' : 'text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title={sellTooltip}
               >
                  <i className={`fas ${frame.isSold ? 'fa-box-open' : 'fa-minus-square'} text-[10px]`}></i>
               </button>
               
               {/* Edit Button - Remains visible even if sold, allows correcting data */}
               <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(frame); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
               >
                  <i className="fas fa-pen text-[10px]"></i>
               </button>
               
               <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(frame.id); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
               >
                  <i className="fas fa-trash text-[10px]"></i>
               </button>
            </div>
          )}
       </div>
    </div>
  );
}

export const FrameList: React.FC<FrameListProps> = ({ frames, onDelete, onEdit, onToggleStatus, onPhysicalSale, onViewSale, userRole, currentCategory }) => {
  const [zoomData, setZoomData] = useState<{ images: string[], index: number } | null>(null);

  const handleZoom = (images: string[], index: number) => {
    setZoomData({ images, index });
  };

  const closeZoom = () => setZoomData(null);

  const nextZoomImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomData) {
      setZoomData({ ...zoomData, index: (zoomData.index + 1) % zoomData.images.length });
    }
  };

  const prevZoomImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomData) {
      setZoomData({ ...zoomData, index: (zoomData.index - 1 + zoomData.images.length) % zoomData.images.length });
    }
  };

  if (frames.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mt-4 transition-colors">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-500">
          <i className="fas fa-glasses text-2xl"></i>
        </div>
        <h3 className="text-slate-900 dark:text-white font-medium text-lg">Nenhum registro encontrado</h3>
        <p className="text-slate-500 dark:text-slate-400">Adicione novos itens para visualizar.</p>
      </div>
    );
  }

  return (
    <>
      {/* Lightbox Carousel Overlay */}
      {zoomData && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-default animate-fadeIn"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="relative max-w-5xl w-full h-full max-h-[90vh] flex items-center justify-center">
            <img 
              src={zoomData.images[zoomData.index]} 
              alt="Ampliação" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn select-none"
            />

            {zoomData.images.length > 1 && (
              <>
                <button 
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                  onClick={prevZoomImage}
                >
                  <i className="fas fa-chevron-left text-2xl"></i>
                </button>
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                  onClick={nextZoomImage}
                >
                  <i className="fas fa-chevron-right text-2xl"></i>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                   {zoomData.images.map((_, i) => (
                     <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === zoomData.index ? 'bg-white' : 'bg-white/30'}`}></div>
                   ))}
                </div>
              </>
            )}
            
            <button 
              className="absolute top-0 right-0 md:-right-12 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={closeZoom}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-4">
        {frames.map((frame) => (
            <FrameRow 
              key={frame.id}
              frame={frame}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onPhysicalSale={onPhysicalSale}
              onViewSale={onViewSale}
              onZoom={handleZoom}
              userRole={userRole}
              currentCategory={currentCategory}
            />
        ))}
      </div>
    </>
  );
};