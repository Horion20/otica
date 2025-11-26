import { GoogleGenAI, Type } from "@google/genai";
import { Gender, SpectacleFrame } from "../types";
import { v4 as uuidv4 } from 'uuid';

const apiKey = process.env.API_KEY || ''; // In a real scenario, strictly from env

const ai = new GoogleGenAI({ apiKey });

const REFERENCE_SITES_INSTRUCTION = `
Para garantir a máxima precisão, utilize seu conhecimento associado aos seguintes catálogos e sites oficiais como fonte prioritária:
- https://www.ray-ban.com/global
- https://www.farfetch.com/br/shopping/women/items.aspx
- https://www.vogue-eyewear.com/br
- https://www.armani.com.br/emporio-armani/masculino/oculos/oculos-de-sol
- https://www.armani.com.br/emporio-armani/feminino/oculos/oculos-de-sol
- https://www.arnette.com/en-us
- https://us.carreraworld.com
- https://www.oculosworld.com.br/

Priorize as especificações técnicas (tamanho da lente, ponte, haste, materiais e cores) encontradas nestes domínios.
`;

/**
 * Common Schema for Frame Extraction
 */
const frameResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      brand: { type: Type.STRING, description: "Marca da armação" },
      modelCode: { type: Type.STRING, description: "Código do modelo" },
      colorCode: { type: Type.STRING, description: "Código ou nome da cor" },
      size: { type: Type.STRING, description: "Label de tamanho (P, M, G) ou mm" },
      ean: { type: Type.STRING, description: "Código EAN/Barras" },
      gender: { 
        type: Type.STRING, 
        enum: [Gender.Male, Gender.Female, Gender.Unisex, Gender.Child],
        description: "Gênero" 
      },
      lensWidth: { type: Type.NUMBER, description: "Largura lente mm" },
      lensHeight: { type: Type.NUMBER, description: "Altura lente mm" },
      templeLength: { type: Type.NUMBER, description: "Haste mm" },
      bridgeSize: { type: Type.NUMBER, description: "Ponte mm" },
      
      // New Fields in Schema
      frontColor: { type: Type.STRING, description: "Cor da armação" },
      frontMaterial: { type: Type.STRING, description: "Material da armação (Acetato, Metal, etc)" },
      templeMaterial: { type: Type.STRING, description: "Material das hastes" },
      lensColor: { type: Type.STRING, description: "Cor das lentes (se aplicável)" },
      lensMaterial: { type: Type.STRING, description: "Material das lentes (Policarbonato, Cristal, etc)" },
      isPolarized: { type: Type.BOOLEAN, description: "Se a lente é polarizada" },

      purchasePrice: { type: Type.NUMBER, description: "Preço de custo/compra" },
      storePrice: { type: Type.NUMBER, description: "Preço de venda na loja / recomendado" },
    },
    required: ["brand", "modelCode", "gender"],
  }
};

/**
 * Helper to map AI response to SpectacleFrame
 */
const mapToSpectacleFrame = (extractedData: any[]): SpectacleFrame[] => {
  return extractedData.map((item: any) => {
    const modelCode = item.modelCode || "N/A";
    const colorCode = item.colorCode || "";
    const name = `${modelCode} ${colorCode}`.trim();

    return {
      id: uuidv4(),
      name: name,
      brand: item.brand || "Desconhecida",
      modelCode: modelCode,
      colorCode: colorCode,
      size: item.size || "",
      ean: item.ean || "",
      gender: item.gender as Gender,
      images: [], 
      isSold: false, 
      category: 'inventory',
      lensWidth: Number(item.lensWidth) || 0,
      lensHeight: Number(item.lensHeight) || 0,
      templeLength: Number(item.templeLength) || 0,
      bridgeSize: Number(item.bridgeSize) || 0,
      
      // Map New Fields
      frontColor: item.frontColor || "",
      frontMaterial: item.frontMaterial || "",
      templeMaterial: item.templeMaterial || "",
      lensColor: item.lensColor || "",
      lensMaterial: item.lensMaterial || "",
      isPolarized: !!item.isPolarized,

      purchasePrice: Number(item.purchasePrice) || 0,
      storePrice: Number(item.storePrice) || 0,
      marketplacePrice: 0,
      createdAt: Date.now()
    };
  });
};

/**
 * Parses raw text (from a PDF/Catalog/Excel) and extracts multiple spectacle frames.
 */
export const parseFramesFromCatalog = async (rawText: string): Promise<SpectacleFrame[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Você é um assistente de entrada de dados ópticos. Analise o seguinte texto extraído de um arquivo e extraia todos os óculos/armações encontrados.
      
      ${REFERENCE_SITES_INSTRUCTION}
      
      Dados do Arquivo:
      ${rawText.substring(0, 50000)} 

      Instruções:
      1. Identifique Marca, Código do Modelo, CÓDIGO DA COR, Medidas.
      2. Identifique preços se houver.
      3. Identifique Materiais e se é Polarizado.
      4. Estime o Gênero com base no estilo da marca (ex: Vogue geralmente Feminino, Arnette geralmente Masculino).
      5. IMPORTANTE: Se houver EAN/UPC no texto, use-o para validar as informações.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: frameResponseSchema
      }
    });

    const text = response.text;
    if (!text) return [];

    return mapToSpectacleFrame(JSON.parse(text));

  } catch (error) {
    console.error("Gemini Bulk Import Error:", error);
    throw new Error("Falha ao processar o arquivo com IA.");
  }
}

/**
 * Analyzes an image (Base64) to extract frame details.
 */
export const parseFrameFromImage = async (base64Data: string, mimeType: string): Promise<SpectacleFrame[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        {
          text: `Analise esta imagem. Ela pode ser uma foto de óculos com etiqueta, um print de catálogo ou uma página de produto.
          Extraia os dados técnicos do óculos presente na imagem.
          
          ${REFERENCE_SITES_INSTRUCTION}

          - Tente ler códigos de barras (EAN) se visíveis na etiqueta.
          - Procure por códigos impressos na haste (ex: 55-18-140) para as medidas.
          - Procure por marca e código do modelo.
          - Identifique a cor.
          - Identifique materiais (metal, acetato) visualmente.
          - Verifique se há indicação de "Polarized".
          - Se houver preço visível, capture.
          `
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: frameResponseSchema
      }
    });

    const text = response.text;
    if (!text) return [];
    return mapToSpectacleFrame(JSON.parse(text));
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw new Error("Falha ao analisar a imagem.");
  }
};

/**
 * Analyzes a URL string to try and extract frame details.
 */
export const parseFrameFromUrl = async (url: string): Promise<SpectacleFrame[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise o seguinte link ou texto de URL e tente extrair os dados do óculos a que ele se refere. 
      URL: ${url}
      
      ${REFERENCE_SITES_INSTRUCTION}
      
      Use seu conhecimento interno sobre a estrutura de URLs de marcas famosas ou dados de produtos conhecidos para inferir as especificações (Marca, Modelo, Cor, Medidas, Gênero, Materiais, Polarização).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: frameResponseSchema
      }
    });

    const text = response.text;
    if (!text) return [];
    return mapToSpectacleFrame(JSON.parse(text));
  } catch (error) {
    console.error("Gemini URL Analysis Error:", error);
    throw new Error("Falha ao analisar o link.");
  }
};