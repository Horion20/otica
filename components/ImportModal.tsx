import React, { useState, useRef, useEffect } from 'react';
import { SpectacleFrame } from '../types';
import { extractTextFromPDF } from '../services/pdfService';
import { extractTextFromExcel } from '../services/excelService';
import { parseFramesFromCatalog, parseFrameFromImage, parseFrameFromUrl } from '../services/geminiService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (frames: SpectacleFrame[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'image'>('files');
  const [status, setStatus] = useState<'idle' | 'reading' | 'analyzing' | 'review'>('idle');
  const [foundFrames, setFoundFrames] = useState<SpectacleFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // File Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Image/Link State
  const [urlInput, setUrlInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{data: string, type: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
        setStatus('idle');
        setError(null);
        setFoundFrames([]);
        setPreviewImage(null);
        setImageFile(null);
        setUrlInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- HANDLERS FOR FILES (PDF/EXCEL) ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus('reading');

    try {
      const fileName = file.name.toLowerCase();
      let text = '';
      let fileTypeStr = '';

      if (fileName.endsWith('.pdf')) {
        fileTypeStr = 'PDF';
        text = await extractTextFromPDF(file);
      } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
        fileTypeStr = 'Excel/CSV';
        text = await extractTextFromExcel(file);
      } else {
        throw new Error("Formato de arquivo não suportado. Use PDF, Excel ou CSV.");
      }
      
      if (!text || text.length < 5) {
        throw new Error(`O arquivo ${fileTypeStr} parece estar vazio ou ilegível.`);
      }

      setStatus('analyzing');
      const frames = await parseFramesFromCatalog(text);
      handleAnalysisResult(frames);

    } catch (err: any) {
      handleError(err);
    }
  };

  // --- HANDLERS FOR IMAGE/LINK ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        // Extract base64 content and mime type
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            setImageFile({ type: matches[1], data: matches[2] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImageOrLink = async () => {
    setError(null);
    setStatus('analyzing');
    setFoundFrames([]);

    try {
        let frames: SpectacleFrame[] = [];

        if (imageFile) {
            // Process Image
            frames = await parseFrameFromImage(imageFile.data, imageFile.type);
        } else if (urlInput.trim()) {
            // Process URL
            frames = await parseFrameFromUrl(urlInput);
        } else {
            throw new Error("Por favor, selecione uma imagem ou insira um link.");
        }

        handleAnalysisResult(frames);

    } catch (err: any) {
        handleError(err);
    }
  };

  // --- COMMON HELPERS ---
  const handleAnalysisResult = (frames: SpectacleFrame[]) => {
    if (frames.length === 0) {
        setError("A IA não identificou dados de óculos válidos.");
        setStatus('idle');
    } else {
        setFoundFrames(frames);
        setStatus('review');
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError(err.message || "Ocorreu um erro no processamento.");
    setStatus('idle');
  };

  const handleConfirmImport = () => {
    // If it was an image import, we might want to attach the image to the frame if requested
    const finalFrames = foundFrames.map(f => {
        if (previewImage && (!f.images || f.images.length === 0) && activeTab === 'image') {
            return { ...f, images: [previewImage] };
        }
        return f;
    });

    onImport(finalFrames);
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
            <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-import"></i>
            </div>
            Importar Dados
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        {status !== 'review' && (
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('files')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'files' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    <i className="fas fa-file-alt mr-2"></i> Documentos (PDF/Excel)
                </button>
                <button 
                    onClick={() => setActiveTab('image')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'image' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    <i className="fas fa-camera mr-2"></i> Imagem / Link
                </button>
            </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-xl"></i>
              <div>
                <p className="font-bold">Erro</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* STATE: IDLE (INPUT) */}
          {status === 'idle' && (
             <>
                {/* --- TAB: FILES --- */}
                {activeTab === 'files' && (
                    <div 
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer group h-full flex flex-col justify-center items-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i className="fas fa-cloud-upload-alt text-3xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Clique para selecionar arquivos</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Suporta <strong>PDF, Excel (.xls, .xlsx) e CSV</strong>. <br/>
                            Ideal para catálogos extensos ou listas de preços.
                        </p>
                        <input 
                            type="file" 
                            accept=".pdf,.xls,.xlsx,.csv" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                        />
                    </div>
                )}

                {/* --- TAB: IMAGE / LINK --- */}
                {activeTab === 'image' && (
                    <div className="space-y-6 h-full flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                            {/* Image Upload Area */}
                            <div 
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${previewImage ? 'border-brand-300 bg-brand-50' : 'border-slate-300 hover:border-brand-300 hover:bg-slate-50'}`}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                                ) : (
                                    <>
                                        <i className="fas fa-image text-3xl text-slate-300 mb-3"></i>
                                        <p className="text-sm font-bold text-slate-600">Carregar Imagem</p>
                                        <p className="text-xs text-slate-400 text-center mt-1">Foto da etiqueta, do óculos ou print da tela</p>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={imageInputRef} 
                                    onChange={handleImageSelect}
                                />
                                {previewImage && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                        Trocar Imagem
                                    </div>
                                )}
                            </div>

                            {/* URL Input Area */}
                            <div className="flex flex-col justify-center">
                                <label className="text-sm font-bold text-slate-700 mb-2">Ou cole um Link / Texto</label>
                                <textarea
                                    className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-400 resize-none text-sm"
                                    placeholder="Cole aqui o link do produto ou a descrição copiada do site..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <button 
                            onClick={handleProcessImageOrLink}
                            disabled={!previewImage && !urlInput.trim()}
                            className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-magic"></i> Analisar e Extrair Dados
                        </button>
                    </div>
                )}
             </>
          )}

          {/* STATE: LOADING */}
          {(status === 'reading' || status === 'analyzing') && (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-brand-600 text-2xl">
                  <i className="fas fa-robot"></i>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {status === 'reading' ? 'Lendo Arquivo...' : 'IA Identificando Óculos...'}
              </h3>
              <p className="text-slate-500">
                {status === 'reading' 
                  ? 'Processando formato do arquivo.' 
                  : 'A Inteligência Artificial está analisando as imagens e textos para encontrar especificações.'}
              </p>
            </div>
          )}

          {/* STATE: REVIEW */}
          {status === 'review' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                   <h3 className="font-bold text-slate-700">
                     {foundFrames.length} Item(ns) Identificado(s)
                   </h3>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Confira os dados antes de salvar
                </span>
              </div>

              <div className="grid gap-3">
                {foundFrames.map((frame) => (
                  <div key={frame.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl group hover:border-brand-300 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 shadow-sm overflow-hidden border border-slate-100 relative">
                      {frame.images && frame.images.length > 0 ? (
                          <img src={frame.images[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                          <i className="fas fa-glasses"></i>
                      )}
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
                         <p className="text-xs text-slate-400">Cor</p>
                         <div className="flex items-center gap-1">
                            <i className="fas fa-palette text-[10px] text-slate-400"></i>
                            <p className="text-sm text-slate-600">{frame.colorCode || '-'}</p>
                         </div>
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
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          {status === 'review' && (
            <button 
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-lg shadow-lg shadow-brand-500/30 hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <i className="fas fa-check"></i> Importar ({foundFrames.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};