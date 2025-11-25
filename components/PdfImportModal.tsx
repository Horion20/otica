import React, { useState, useRef } from 'react';
import { SpectacleFrame } from '../types';
import { extractTextFromPDF } from '../services/pdfService';
import { parseFramesFromCatalog } from '../services/geminiService';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (frames: SpectacleFrame[]) => void;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [status, setStatus] = useState<'idle' | 'reading' | 'analyzing' | 'review'>('idle');
  const [foundFrames, setFoundFrames] = useState<SpectacleFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Por favor, selecione apenas arquivos PDF.");
      return;
    }

    setError(null);
    setStatus('reading');

    try {
      // 1. Extract Text
      const text = await extractTextFromPDF(file);
      
      if (text.length < 10) {
        throw new Error("Não foi possível ler texto deste PDF. Ele pode ser uma imagem escaneada.");
      }

      // 2. Send to AI
      setStatus('analyzing');
      const frames = await parseFramesFromCatalog(text);
      
      if (frames.length === 0) {
         setError("A IA não identificou nenhum óculos neste documento.");
         setStatus('idle');
      } else {
        setFoundFrames(frames);
        setStatus('review');
      }

    } catch (err: any) {
      setError(err.message || "Erro ao processar arquivo.");
      setStatus('idle');
    }
  };

  const handleConfirmImport = () => {
    onImport(foundFrames);
    handleClose();
  };

  const handleClose = () => {
    setStatus('idle');
    setFoundFrames([]);
    setError(null);
    onClose();
  };

  const handleRemoveItem = (id: string) => {
    setFoundFrames(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-pdf"></i>
            </div>
            Importar via PDF
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              <div>
                <p className="font-bold">Erro na Importação</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-cloud-upload-alt text-3xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Clique para selecionar um arquivo PDF</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Carregue catálogos, notas fiscais ou listas de preços. A IA irá identificar e extrair os modelos automaticamente.
              </p>
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
            </div>
          )}

          {(status === 'reading' || status === 'analyzing') && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-brand-600 text-2xl">
                  <i className="fas fa-magic"></i>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {status === 'reading' ? 'Lendo Arquivo PDF...' : 'IA Analisando Conteúdo...'}
              </h3>
              <p className="text-slate-500">
                {status === 'reading' 
                  ? 'Extraindo texto das páginas do documento.' 
                  : 'Identificando marcas, modelos e especificações técnicas.'}
              </p>
            </div>
          )}

          {status === 'review' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">
                  {foundFrames.length} Itens Encontrados
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Confira os dados antes de salvar
                </span>
              </div>

              <div className="grid gap-3">
                {foundFrames.map((frame) => (
                  <div key={frame.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl group hover:border-brand-300 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                      <i className="fas fa-glasses"></i>
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <p className="text-xs text-slate-400">Marca</p>
                        <p className="font-bold text-slate-800 text-sm">{frame.brand}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Modelo</p>
                        <p className="font-medium text-slate-700 text-sm">{frame.modelCode}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400">Gênero</p>
                         <p className="text-sm text-slate-600">{frame.gender}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400">Dimensões</p>
                         <p className="text-xs font-mono text-slate-600">
                           {frame.lensWidth}-{frame.bridgeSize}-{frame.templeLength}
                         </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(frame.id)}
                      className="text-slate-300 hover:text-red-500 p-2"
                      title="Remover este item"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={handleClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          {status === 'review' && (
            <button 
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-lg shadow-lg shadow-brand-500/30 hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <i className="fas fa-check"></i> Confirmar Importação ({foundFrames.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};