import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { SpectacleFrame, Gender } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { fetchFrameDetails } from '../services/geminiService';

interface FrameFormProps {
  initialData?: SpectacleFrame;
  onSave: (frame: SpectacleFrame) => void;
  onCancel?: () => void;
}

const initialFormState = {
  brand: '',
  modelCode: '',
  colorCode: '',
  size: '',
  ean: '',
  gender: '' as Gender,
  images: [] as string[],
  lensWidth: '',
  lensHeight: '',
  templeLength: '',
  bridgeSize: '',
  purchasePrice: '',
  storePrice: '',
  // New Fields
  frontColor: '',
  frontMaterial: '',
  templeMaterial: '',
  lensColor: '',
  lensMaterial: '',
  isPolarized: 'false', // Using string for select interaction
};

export const FrameForm: React.FC<FrameFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadIndex, setActiveUploadIndex] = useState<number>(0);

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: initialData.brand,
        modelCode: initialData.modelCode,
        colorCode: initialData.colorCode || '',
        size: initialData.size,
        ean: initialData.ean,
        gender: initialData.gender,
        images: initialData.images || [],
        lensWidth: initialData.lensWidth.toString(),
        lensHeight: initialData.lensHeight.toString(),
        templeLength: initialData.templeLength.toString(),
        bridgeSize: initialData.bridgeSize.toString(),
        purchasePrice: initialData.purchasePrice ? initialData.purchasePrice.toString() : '',
        storePrice: initialData.storePrice ? initialData.storePrice.toString() : '',
        // New Fields
        frontColor: initialData.frontColor || '',
        frontMaterial: initialData.frontMaterial || '',
        templeMaterial: initialData.templeMaterial || '',
        lensColor: initialData.lensColor || '',
        lensMaterial: initialData.lensMaterial || '',
        isPolarized: initialData.isPolarized ? 'true' : 'false',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTriggerUpload = (index: number) => {
    setActiveUploadIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => {
          const newImages = [...prev.images];
          if (activeUploadIndex < newImages.length) {
            newImages[activeUploadIndex] = result;
          } else {
            newImages.push(result);
          }
          return { ...prev, images: newImages };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      images: prev.images.filter((_, i) => i !== index) 
    }));
  };

  const handleAutoFill = async () => {
    if (!formData.brand || !formData.modelCode) {
        setError("Preencha Marca e Modelo para usar o Auto-Complete.");
        return;
    }
    
    setError(null);
    setIsAutoFilling(true);

    try {
        const specs = await fetchFrameDetails(formData.brand, formData.modelCode);
        setFormData(prev => {
            return {
                ...prev,
                lensWidth: specs.lensWidth ? specs.lensWidth.toString() : prev.lensWidth,
                lensHeight: specs.lensHeight ? specs.lensHeight.toString() : prev.lensHeight,
                templeLength: specs.templeLength ? specs.templeLength.toString() : prev.templeLength,
                bridgeSize: specs.bridgeSize ? specs.bridgeSize.toString() : prev.bridgeSize,
                gender: specs.gender || prev.gender,
                ean: specs.ean || prev.ean,
                frontMaterial: specs.frontMaterial || prev.frontMaterial,
                isPolarized: specs.isPolarized !== undefined ? (specs.isPolarized ? 'true' : 'false') : prev.isPolarized,
            };
        });
    } catch (err) {
        setError("Falha ao buscar detalhes online. Tente novamente.");
    } finally {
        setIsAutoFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.modelCode || !formData.gender) {
      setError("Por favor preencha os campos obrigatórios.");
      return;
    }

    // Generate name: Model Code + Color Code
    const generatedName = `${formData.modelCode} ${formData.colorCode}`.trim();

    const frameToSave: SpectacleFrame = {
      id: initialData ? initialData.id : uuidv4(), // Keep ID if editing, generate new if creating
      name: generatedName,
      brand: formData.brand,
      modelCode: formData.modelCode,
      colorCode: formData.colorCode,
      size: formData.size,
      ean: formData.ean,
      gender: formData.gender as Gender,
      images: formData.images,
      isSold: initialData ? initialData.isSold : false, // Preserve status or default to false
      category: initialData ? initialData.category : 'inventory', // Preserve category or default to inventory
      
      lensWidth: Number(formData.lensWidth) || 0,
      lensHeight: Number(formData.lensHeight) || 0,
      templeLength: Number(formData.templeLength) || 0,
      bridgeSize: Number(formData.bridgeSize) || 0,
      
      // New Fields
      frontColor: formData.frontColor,
      frontMaterial: formData.frontMaterial,
      templeMaterial: formData.templeMaterial,
      lensColor: formData.lensColor,
      lensMaterial: formData.lensMaterial,
      isPolarized: formData.isPolarized === 'true',

      purchasePrice: Number(formData.purchasePrice) || 0,
      storePrice: Number(formData.storePrice) || 0,
      marketplacePrice: 0, 
      createdAt: initialData ? initialData.createdAt : Date.now()
    };

    onSave(frameToSave);
    
    if (!initialData) {
        setFormData(initialFormState);
    }
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className={`fas ${initialData ? 'fa-pen-to-square' : 'fa-glasses'} text-brand-600`}></i>
          {initialData ? 'Editar Óculos' : 'Novo Registro'}
        </h2>
        {!initialData && (
             <button
                type="button"
                onClick={handleAutoFill}
                disabled={isAutoFilling}
                className="text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg border border-brand-100 font-bold flex items-center gap-2 hover:bg-brand-100 transition-colors disabled:opacity-50"
             >
                {isAutoFilling ? (
                    <><i className="fas fa-circle-notch fa-spin"></i> Buscando...</>
                ) : (
                    <><i className="fas fa-magic"></i> Auto-Complete com IA</>
                )}
             </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Upload Section (Left Column on Large Screens) */}
        <div className="lg:col-span-1">
           <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Imagens ({formData.images.length}/3)</h3>
           </div>
           
           <div className="grid grid-cols-3 gap-2">
             {[0, 1, 2].map((index) => (
               <div key={index} className="relative aspect-square">
                 {formData.images[index] ? (
                   <div className="w-full h-full relative group rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={formData.images[index]} 
                        alt={`Slot ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTriggerUpload(index)}
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-brand-600 transition-colors"
                          title="Alterar Imagem"
                        >
                          <i className="fas fa-pencil text-xs"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-red-500 transition-colors"
                          title="Remover Imagem"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 rounded">
                        {index + 1}
                      </div>
                   </div>
                 ) : (
                   <div 
                      className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors text-slate-300 hover:text-brand-500"
                      onClick={() => handleTriggerUpload(index)}
                   >
                     <i className="fas fa-plus text-lg mb-1"></i>
                     <span className="text-[10px] font-medium">Add</span>
                   </div>
                 )}
               </div>
             ))}
           </div>
           <p className="text-xs text-slate-400 mt-2 text-center">Adicione até 3 fotos (Frente, Lateral, Detalhe).</p>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*"
             onChange={handleImageUpload} 
           />
        </div>

        {/* Main Form Data (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Identificação */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Marca"
                name="brand"
                placeholder="Ex: Ray-Ban, Oakley"
                value={formData.brand}
                onChange={handleChange}
                required
              />
              <Input
                label="Código do Modelo"
                name="modelCode"
                placeholder="Ex: RB3025"
                value={formData.modelCode}
                onChange={handleChange}
                required
              />
              <Input
                label="Código da Cor"
                name="colorCode"
                placeholder="Ex: 001/58, Preto Fosco"
                value={formData.colorCode}
                onChange={handleChange}
                icon={<i className="fas fa-palette text-xs"></i>}
              />
              <Input
                label="Código EAN"
                name="ean"
                placeholder="789..."
                value={formData.ean}
                onChange={handleChange}
                icon={<i className="fas fa-barcode text-xs"></i>}
              />
              <Input
                label="Tamanho (Ref)"
                name="size"
                placeholder="Ex: M, 55"
                value={formData.size}
                onChange={handleChange}
              />
              <Select
                label="Gênero"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: Gender.Male, label: 'Masculino' },
                  { value: Gender.Female, label: 'Feminino' },
                  { value: Gender.Unisex, label: 'Unissex' },
                  { value: Gender.Child, label: 'Infantil' },
                ]}
                required
              />
            </div>
          </div>

          {/* New Section: Características & Materiais */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Características & Materiais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
               <Input
                label="Cor da Frente"
                name="frontColor"
                placeholder="Ex: Preto"
                value={formData.frontColor}
                onChange={handleChange}
               />
               <Input
                label="Material da Frente"
                name="frontMaterial"
                placeholder="Ex: Acetato, Metal"
                value={formData.frontMaterial}
                onChange={handleChange}
               />
               <Input
                label="Material das Hastes"
                name="templeMaterial"
                placeholder="Ex: Aço, Titânio"
                value={formData.templeMaterial}
                onChange={handleChange}
               />
               <Input
                label="Cor da Lente"
                name="lensColor"
                placeholder="Ex: Verde G15"
                value={formData.lensColor}
                onChange={handleChange}
               />
               <Input
                label="Material da Lente"
                name="lensMaterial"
                placeholder="Ex: Policarbonato"
                value={formData.lensMaterial}
                onChange={handleChange}
               />
               <Select
                label="Polarizado"
                name="isPolarized"
                value={formData.isPolarized}
                onChange={handleChange}
                options={[
                  { value: 'false', label: 'Não' },
                  { value: 'true', label: 'Sim' },
                ]}
               />
            </div>
          </div>

          {/* Technical Dimensions */}
          <div>
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Dimensões Técnicas (mm)</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Input
                  label="Largura Lente"
                  name="lensWidth"
                  type="number"
                  placeholder="0"
                  value={formData.lensWidth}
                  onChange={handleChange}
                  icon={<i className="fas fa-arrows-alt-h text-slate-400"></i>}
                />
                <Input
                  label="Altura Lente"
                  name="lensHeight"
                  type="number"
                  placeholder="0"
                  value={formData.lensHeight}
                  onChange={handleChange}
                  icon={<i className="fas fa-arrows-alt-v text-slate-400"></i>}
                />
                <Input
                  label="Ponte"
                  name="bridgeSize"
                  type="number"
                  placeholder="0"
                  value={formData.bridgeSize}
                  onChange={handleChange}
                  icon={<i className="fas fa-archway text-slate-400"></i>}
                />
                <Input
                  label="Haste"
                  name="templeLength"
                  type="number"
                  placeholder="0"
                  value={formData.templeLength}
                  onChange={handleChange}
                  icon={<i className="fas fa-ruler-horizontal text-slate-400"></i>}
                />
             </div>
          </div>

          {/* Financial Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Financeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <Input
                  label="Preço de Compra"
                  name="purchasePrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  icon={<span className="text-xs font-bold">R$</span>}
               />
               <Input
                  label="Preço Recomendado"
                  name="storePrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.storePrice}
                  onChange={handleChange}
                  icon={<span className="text-xs font-bold">R$</span>}
                  className="font-bold"
               />
            </div>
          </div>

        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
        {initialData && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="bg-brand-600 text-white px-8 py-3 rounded-lg shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-brand-600/40 active:scale-95 transition-all duration-200 font-medium text-lg flex items-center gap-2"
        >
          <i className="fas fa-save"></i> {initialData ? 'Salvar Alterações' : 'Salvar Registro'}
        </button>
      </div>
    </form>
  );
};