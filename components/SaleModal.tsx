import React, { useState, useEffect } from 'react';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (platform: string, quantity: number) => void;
  maxQuantity?: number;
}

export const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, onConfirm, maxQuantity = 1 }) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = (platform: string) => {
    onConfirm(platform, quantity);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-slate-100 dark:border-slate-700">
        
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="fas fa-cash-register"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Registrar Venda</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Informe a quantidade e o local da venda.
          </p>
        </div>

        <div className="px-6 pt-4 pb-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Quantidade Vendida (Máx: {maxQuantity})
            </label>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center"
                >
                    <i className="fas fa-minus text-slate-600 dark:text-slate-300"></i>
                </button>
                <div className="flex-1 text-center font-bold text-2xl text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900/50 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {quantity}
                </div>
                <button 
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center"
                >
                    <i className="fas fa-plus text-slate-600 dark:text-slate-300"></i>
                </button>
            </div>
        </div>

        <div className="p-6 grid gap-3">
          <button
            onClick={() => handleConfirm('inventory')}
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-store text-xl text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400"></i>
              <div className="text-left">
                <span className="block font-bold">Loja Física</span>
                <span className="text-[10px] text-slate-400">Balcão</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-slate-300"></i>
          </button>

          <button
            onClick={() => handleConfirm('mercadolivre')}
            className="w-full py-3 px-4 bg-[#fff159]/10 hover:bg-[#fff159]/30 border border-[#fff159]/50 text-slate-800 dark:text-white rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-handshake text-xl text-[#2d3277]"></i>
              <div className="text-left">
                <span className="block font-bold">Mercado Livre</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Online</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-slate-300"></i>
          </button>

          <button
            onClick={() => handleConfirm('shopee')}
            className="w-full py-3 px-4 bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/20 border border-[#ee4d2d]/30 text-slate-800 dark:text-white rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-shopping-bag text-xl text-[#ee4d2d]"></i>
              <div className="text-left">
                <span className="block font-bold">Shopee</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Online</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-slate-300"></i>
          </button>

          <button
            onClick={() => handleConfirm('amazon')}
            className="w-full py-3 px-4 bg-[#232f3e]/5 dark:bg-[#232f3e]/40 hover:bg-[#232f3e]/10 dark:hover:bg-[#232f3e]/60 border border-[#232f3e]/20 text-slate-800 dark:text-white rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <i className="fab fa-amazon text-xl text-[#ff9900]"></i>
              <div className="text-left">
                <span className="block font-bold">Amazon</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Online</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-slate-300"></i>
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={onClose}
            className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};