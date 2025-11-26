import React, { useState } from 'react';
import { SpectacleFrame, UserRole } from '../types';

interface FrameListProps {
  frames: SpectacleFrame[];
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onEdit: (frame: SpectacleFrame) => void;
  onToggleStatus: (frame: SpectacleFrame) => void;
  userRole?: UserRole;
}

// Internal component to handle Brand display (Text Badge only)
const BrandBadge: React.FC<{ brand: string }> = ({ brand }) => {
  return (
    <span className="inline-block px-2 py-0.5 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-[10px] font-bold rounded uppercase tracking-wide border border-brand-100 dark:border-brand-800 whitespace-nowrap">
      {brand}
    </span>
  );
};

// Internal Card Component (Grid View)
const FrameCard: React.FC<{ 
  frame: SpectacleFrame; 
  onDelete: (id: string) => void;
  onEdit: (frame: SpectacleFrame) => void;
  onToggleStatus: (frame: SpectacleFrame) => void;
  onZoom: (images: string[], initialIndex: number) => void;
  userRole?: UserRole;
}> = ({ frame, onDelete, onEdit, onToggleStatus, onZoom, userRole }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const canEdit = userRole !== 'Visitante';

  const formatMoney = (val: number) => {
    return val ? `R$ ${val.toFixed(2).replace('.', ',')}` : '-';
  };

  const images = frame.images && frame.images.length > 0 ? frame.images : [];
  const hasImages = images.length > 0;
  const isMulti = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border overflow-hidden group flex flex-col relative ${frame.isSold ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
    >
      {frame.isSold && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-red-400 z-10"></div>
      )}

      <div className="p-5 flex-1 relative">
        {/* Sold Badge Overlay */}
        {frame.isSold && (
          <div className="absolute top-4 right-16 transform rotate-12 pointer-events-none opacity-30 z-0">
            <span className="text-4xl font-black text-red-600 border-4 border-red-600 px-2 py-1 rounded uppercase tracking-widest">
              ESGOTADO
            </span>
          </div>
        )}

        <div className="flex items-start gap-4 mb-4 relative z-10">
          {/* Image Carousel */}
          <div 
            className={`w-20 h-20 rounded-lg flex-shrink-0 border relative overflow-hidden ${frame.isSold ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 opacity-70' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}
          >
            <div 
               className={`w-full h-full flex items-center justify-center ${hasImages ? 'cursor-zoom-in' : ''}`}
               onClick={() => hasImages && onZoom(images, currentImgIndex)}
            >
               {hasImages ? (
                  <img src={images[currentImgIndex]} alt={frame.name} className={`w-full h-full object-cover ${frame.isSold ? 'grayscale' : ''}`} />
               ) : (
                  <i className={`fas fa-glasses text-2xl ${frame.isSold ? 'text-red-300 dark:text-red-800' : 'text-slate-300 dark:text-slate-600'}`}></i>
               )}
            </div>
            
            {/* Polarized Badge on Image */}
            {frame.isPolarized && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-wider">
                Polarizado
              </div>
            )}

            {/* Controls Overlay */}
            {isMulti && (
               <>
                 <button onClick={prevImage} className="absolute left-0 top-0 bottom-0 w-5 bg-black/10 hover:bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-chevron-left text-[10px]"></i>
                 </button>
                 <button onClick={nextImage} className="absolute right-0 top-0 bottom-0 w-5 bg-black/10 hover:bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-chevron-right text-[10px]"></i>
                 </button>
                 <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, idx) => (
                       <div key={idx} className={`w-1 h-1 rounded-full ${idx === currentImgIndex ? 'bg-white' : 'bg-white/40'}`}></div>
                    ))}
                 </div>
               </>
            )}
          </div>

          {/* Info Header */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div className="flex flex-wrap gap-2 mb-1 items-center h-6">
                  <BrandBadge brand={frame.brand} />
                </div>
                
                {/* Actions */}
                {canEdit && (
                  <div className="flex items-center gap-1 -mt-1 -mr-1">
                      <button 
                        onClick={() => onToggleStatus(frame)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${frame.isSold ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        title={frame.isSold ? "Marcar como Disponível" : "Marcar como Esgotado/Vendido"}
                      >
                        <i className={`fas ${frame.isSold ? 'fa-box-open' : 'fa-box'}`}></i>
                      </button>
                      <button 
                        onClick={() => onEdit(frame)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                        title="Editar"
                      >
                        <i className="fas fa-pencil-alt text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onDelete(frame.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Apagar"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                  </div>
                )}
            </div>
            
            <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate" title={frame.name || frame.modelCode}>
                {frame.name || frame.modelCode}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">EAN: {frame.ean || 'N/A'}</p>
          </div>
        </div>

        {/* Details Grid: Gender | Size | Color */}
        <div className={`rounded-lg p-3 grid grid-cols-3 gap-2 text-sm mb-4 ${frame.isSold ? 'bg-red-100/50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
          <div className="flex flex-col">
            <span className="text-slate-400 dark:text-slate-500 text-xs">Gênero</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={frame.gender}>{frame.gender}</span>
          </div>
          <div className="flex flex-col">
             <span className="text-slate-400 dark:text-slate-500 text-xs">Tamanho</span>
             <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{frame.size || '-'}</span>
          </div>
          <div className="flex flex-col">
             <span className="text-slate-400 dark:text-slate-500 text-xs">Cor</span>
             <div className="flex items-center gap-1.5 mt-0.5">
               <i className="fas fa-palette text-slate-400 dark:text-slate-500 text-[10px]"></i>
               <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title="Código da Cor">{frame.colorCode || '-'}</span>
             </div>
          </div>
        </div>

        {/* Dimensions with FontAwesome Icons */}
        <div className="grid grid-cols-4 gap-2 text-center mb-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg py-2">
          <div className="flex flex-col items-center gap-1" title="Largura da Lente">
            <i className="fas fa-arrows-alt-h text-slate-400 dark:text-slate-500"></i>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{frame.lensWidth}</span>
          </div>
          <div className="flex flex-col items-center gap-1" title="Altura da Lente">
             <i className="fas fa-arrows-alt-v text-slate-400 dark:text-slate-500"></i>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{frame.lensHeight}</span>
          </div>
          <div className="flex flex-col items-center gap-1" title="Ponte">
            <i className="fas fa-archway text-slate-400 dark:text-slate-500"></i>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{frame.bridgeSize}</span>
          </div>
          <div className="flex flex-col items-center gap-1" title="Haste">
            <i className="fas fa-ruler-horizontal text-slate-400 dark:text-slate-500"></i>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{frame.templeLength}</span>
          </div>
        </div>
      </div>
      
      {/* Financial Footer */}
      <div className={`border-t dark:border-slate-700 p-3 flex justify-between items-center ${frame.isSold ? 'bg-red-100/50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-slate-50/50 dark:bg-slate-700/30 border-slate-100'}`}>
         <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Custo</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formatMoney(frame.purchasePrice)}</span>
         </div>
         <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-2"></div>
         <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Preço Recomendado</span>
            <span className="text-sm font-bold text-brand-700 dark:text-brand-400">{formatMoney(frame.storePrice)}</span>
         </div>
      </div>
    </div>
  );
};

// Internal Row Component (List View)
const FrameRow: React.FC<{
  frame: SpectacleFrame;
  onDelete: (id: string) => void;
  onEdit: (frame: SpectacleFrame) => void;
  onToggleStatus: (frame: SpectacleFrame) => void;
  onZoom: (images: string[], initialIndex: number) => void;
  userRole?: UserRole;
}> = ({ frame, onDelete, onEdit, onToggleStatus, onZoom, userRole }) => {
  const canEdit = userRole !== 'Visitante';

  const formatMoney = (val: number) => {
    return val ? `R$ ${val.toFixed(2).replace('.', ',')}` : '-';
  };
  
  const images = frame.images && frame.images.length > 0 ? frame.images : [];
  const hasImages = images.length > 0;
  
  // Decide which price to show based on Category
  const priceLabel = frame.category === 'marketplace' ? 'PREÇO' : 'CUSTO';
  const priceValue = frame.category === 'marketplace' ? frame.storePrice : frame.purchasePrice;

  return (
    <div className={`p-3 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md ${frame.isSold ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800'}`}>
       {/* Image */}
       <div 
         className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0 overflow-hidden cursor-pointer relative"
         onClick={() => hasImages && onZoom(images, 0)}
       >
         {hasImages ? (
            <img src={images[0]} alt={frame.name} className={`w-full h-full object-cover ${frame.isSold ? 'grayscale' : ''}`} />
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
          <h3 className={`text-sm font-bold truncate ${frame.isSold ? 'text-slate-600 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
            {frame.name || frame.modelCode}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <BrandBadge brand={frame.brand} />
            {frame.colorCode && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600">
                <i className="fas fa-palette"></i>
                <span>{frame.colorCode}</span>
              </div>
            )}
          </div>
       </div>

       {/* Actions & Price */}
       <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
             <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">{priceLabel}</span>
             <span className={`text-sm font-bold ${frame.isSold ? 'text-slate-500 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
               {formatMoney(priceValue)}
             </span>
          </div>
          
          {/* Mini Actions */}
          {canEdit && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-100 dark:border-slate-700">
               <button 
                  onClick={() => onToggleStatus(frame)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${frame.isSold ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title={frame.isSold ? "Marcar Disponível" : "Marcar Vendido"}
               >
                  <i className={`fas ${frame.isSold ? 'fa-box-open' : 'fa-box'} text-[10px]`}></i>
               </button>
               <button 
                  onClick={() => onEdit(frame)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
               >
                  <i className="fas fa-pen text-[10px]"></i>
               </button>
               <button 
                  onClick={() => onDelete(frame.id)}
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

export const FrameList: React.FC<FrameListProps> = ({ frames, viewMode, onDelete, onEdit, onToggleStatus, userRole }) => {
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

      <div className={`mt-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-3'}`}>
        {frames.map((frame) => (
           viewMode === 'grid' ? (
            <FrameCard 
              key={frame.id} 
              frame={frame} 
              onDelete={onDelete} 
              onEdit={onEdit} 
              onToggleStatus={onToggleStatus}
              onZoom={handleZoom}
              userRole={userRole}
            />
           ) : (
            <FrameRow 
              key={frame.id}
              frame={frame}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onZoom={handleZoom}
              userRole={userRole}
            />
           )
        ))}
      </div>
    </>
  );
};