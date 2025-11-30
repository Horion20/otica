import React, { useState, useEffect } from 'react';
import { BuyerInfo } from '../types';
import { fetchAddressByCep } from '../services/cepService';
import { Input } from './Input';
import { Select } from './Select';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (platform: string, quantity: number, buyerInfo?: BuyerInfo, generateReceipt?: boolean) => void;
  maxQuantity?: number;
  defaultPlatform?: string;
}

export const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, onConfirm, maxQuantity = 1, defaultPlatform = 'inventory' }) => {
  const [quantity, setQuantity] = useState(1);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [generateReceipt, setGenerateReceipt] = useState(false);
  
  // Buyer Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  
  // Address State
  const [buyerCep, setBuyerCep] = useState('');
  const [buyerStreet, setBuyerStreet] = useState('');
  const [buyerNumber, setBuyerNumber] = useState('');
  const [buyerNeighborhood, setBuyerNeighborhood] = useState('');
  const [buyerComplement, setBuyerComplement] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerState, setBuyerState] = useState('');
  
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
        setBuyerName('');
        setBuyerCpf('');
        setBuyerPhone('');
        
        setBuyerCep('');
        setBuyerStreet('');
        setBuyerNumber('');
        setBuyerNeighborhood('');
        setBuyerComplement('');
        setBuyerCity('');
        setBuyerState('');
        
        setPlatform(defaultPlatform || 'inventory');
        setGenerateReceipt(false);
    }
  }, [isOpen, defaultPlatform]);

  const handleCepBlur = async () => {
    if (buyerCep.length >= 8) {
        setLoadingCep(true);
        try {
            const address = await fetchAddressByCep(buyerCep);
            setBuyerCity(address.city);
            setBuyerState(address.state);
            // Preencher campos de endereço retornados
            if (address.street) setBuyerStreet(address.street);
            if (address.neighborhood) setBuyerNeighborhood(address.neighborhood);
        } catch (error) {
            // Silently fail or show small toast
        } finally {
            setLoadingCep(false);
        }
    }
  };

  const handleConfirm = () => {
    const buyerInfo: BuyerInfo = {
        name: buyerName,
        cpf: buyerCpf,
        phone: buyerPhone,
        cep: buyerCep,
        city: buyerCity,
        state: buyerState,
        street: buyerStreet,
        number: buyerNumber,
        neighborhood: buyerNeighborhood,
        complement: buyerComplement
    };
    onConfirm(platform, quantity, buyerInfo, generateReceipt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 border border-slate-100 dark:border-slate-700 flex flex-col max-h-[95vh]">
        
        <div className="p-5 text-center border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
            <i className="fas fa-cash-register text-brand-600"></i> 
            Registrar Venda
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Quantity Section */}
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Quantidade a Vender (Disp: {maxQuantity})
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

            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <i className="fas fa-user-tag"></i> Dados do Comprador
                </h3>
                
                <div className="space-y-4">
                    <Input 
                        label="Nome Completo"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Nome do cliente"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="CPF"
                            value={buyerCpf}
                            onChange={(e) => setBuyerCpf(e.target.value)}
                            placeholder="000.000.000-00"
                        />
                        <Input 
                            label="Telefone"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    
                    {/* Endereço Detalhado */}
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço de Entrega</h4>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <Input 
                                    label="CEP"
                                    value={buyerCep}
                                    onChange={(e) => setBuyerCep(e.target.value)}
                                    onBlur={handleCepBlur}
                                    placeholder="00000-000"
                                    icon={loadingCep ? <i className="fas fa-spinner fa-spin text-xs"></i> : undefined}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input 
                                    label="Cidade"
                                    value={buyerCity}
                                    onChange={(e) => setBuyerCity(e.target.value)}
                                    readOnly
                                    className="opacity-80"
                                />
                            </div>
                            <div className="col-span-1">
                                <Input 
                                    label="UF"
                                    value={buyerState}
                                    onChange={(e) => setBuyerState(e.target.value)}
                                    readOnly
                                    className="opacity-80"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Input 
                                    label="Rua / Logradouro"
                                    value={buyerStreet}
                                    onChange={(e) => setBuyerStreet(e.target.value)}
                                    placeholder="Nome da rua"
                                />
                            </div>
                            <div className="col-span-1">
                                <Input 
                                    label="Número"
                                    value={buyerNumber}
                                    onChange={(e) => setBuyerNumber(e.target.value)}
                                    placeholder="Nº"
                                />
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-3">
                            <Input 
                                label="Bairro"
                                value={buyerNeighborhood}
                                onChange={(e) => setBuyerNeighborhood(e.target.value)}
                                placeholder="Bairro"
                            />
                            <Input 
                                label="Complemento"
                                value={buyerComplement}
                                onChange={(e) => setBuyerComplement(e.target.value)}
                                placeholder="Apto, Bloco..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform & Options */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-4">
                <Select
                    label="Canal de Venda"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    options={[
                        { value: 'inventory', label: 'Loja Física (Balcão)' },
                        { value: 'mercadolivre', label: 'Mercado Livre' },
                        { value: 'shopee', label: 'Shopee' },
                        { value: 'amazon', label: 'Amazon' },
                    ]}
                />
                
                <label className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 rounded-lg cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={generateReceipt}
                        onChange={(e) => setGenerateReceipt(e.target.checked)}
                        className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-brand-800 dark:text-brand-300 text-sm">Gerar Nota Fiscal / Recibo</span>
                        <span className="text-xs text-brand-600 dark:text-brand-400">Salvar PDF com código de barras após confirmar</span>
                    </div>
                </label>
            </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl"
          >
            Cancelar
          </button>
          
          <button 
            onClick={handleConfirm}
            className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-check"></i> 
            Confirmar {generateReceipt ? '& Imprimir' : 'Venda'}
          </button>
        </div>
      </div>
    </div>
  );
};