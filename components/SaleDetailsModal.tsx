import React from 'react';
import { SpectacleFrame } from '../types';
import { generateReceiptPDF } from '../services/receiptGenerator';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  frame: SpectacleFrame | null;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({ isOpen, onClose, frame }) => {
  if (!isOpen || !frame) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatMoney = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePrintReceipt = () => {
    generateReceiptPDF(frame);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-red-50 dark:bg-red-900/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <i className="fas fa-file-invoice-dollar"></i>
            Detalhes da Venda
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Product Info */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
             <div className="w-16 h-16 bg-white dark:bg-slate-600 rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-500 overflow-hidden">
                {frame.images && frame.images.length > 0 ? (
                  <img src={frame.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <i className="fas fa-glasses text-xl"></i>
                  </div>
                )}
             </div>
             <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{frame.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{frame.brand} • {frame.modelCode}</p>
                <div className="mt-1 flex gap-2">
                   <span className="text-xs font-bold bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      Qtd Vendida: {frame.soldQuantity || 1}
                   </span>
                   <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                      {formatMoney(frame.storePrice)}
                   </span>
                </div>
             </div>
          </div>

          {/* Sale Info */}
          <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informações da Transação</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg">
                   <p className="text-[10px] text-slate-400 uppercase">Data da Venda</p>
                   <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{formatDate(frame.soldAt)}</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg">
                   <p className="text-[10px] text-slate-400 uppercase">Plataforma</p>
                   <p className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase flex items-center gap-2">
                      {frame.soldPlatform === 'mercadolivre' && <i className="fas fa-handshake text-[#ffe600]"></i>}
                      {frame.soldPlatform === 'shopee' && <i className="fas fa-shopping-bag text-[#ee4d2d]"></i>}
                      {frame.soldPlatform === 'amazon' && <i className="fab fa-amazon text-[#ff9900]"></i>}
                      {frame.soldPlatform === 'inventory' && <i className="fas fa-store text-slate-500"></i>}
                      {frame.soldPlatform || 'Não Informado'}
                   </p>
                </div>
             </div>
          </div>

          {/* Buyer Info */}
          {frame.buyerInfo ? (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dados do Comprador</h3>
                <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-600">
                        <p className="text-xs text-slate-400 uppercase">Nome</p>
                        <p className="font-bold text-slate-800 dark:text-white">{frame.buyerInfo.name || 'Não informado'}</p>
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="p-4 border-r border-slate-50 dark:border-slate-600">
                            <p className="text-xs text-slate-400 uppercase">CPF</p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{frame.buyerInfo.cpf || '-'}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-slate-400 uppercase">Telefone</p>
                            <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{frame.buyerInfo.phone || '-'}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-600">
                        <p className="text-xs text-slate-400 uppercase mb-1">Endereço de Entrega</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                            {frame.buyerInfo.street ? (
                                <>
                                  {frame.buyerInfo.street}, {frame.buyerInfo.number} {frame.buyerInfo.complement ? `(${frame.buyerInfo.complement})` : ''}
                                  <br/>
                                  {frame.buyerInfo.neighborhood} - {frame.buyerInfo.city} / {frame.buyerInfo.state}
                                </>
                            ) : (
                                frame.buyerInfo.city ? `${frame.buyerInfo.city} - ${frame.buyerInfo.state}` : 'Endereço não informado'
                            )}
                        </p>
                        {frame.buyerInfo.cep && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">CEP: {frame.buyerInfo.cep}</p>
                        )}
                    </div>
                </div>
              </div>
          ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm italic">Nenhum dado do comprador registrado.</p>
              </div>
          )}

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
            <button 
                onClick={handlePrintReceipt}
                className="px-6 py-2 bg-slate-800 text-white hover:bg-slate-900 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
            >
                <i className="fas fa-print"></i> Imprimir Nota Fiscal
            </button>
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};