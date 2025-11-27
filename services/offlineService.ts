import { SpectacleFrame, Gender } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Normalizes a string key to match against possible column names.
 * e.g., "Preço de Custo" -> "precodecusto"
 */
const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Helper to parse Brazilian currency strings to number
 */
const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val);
  // Remove symbols, currency codes, spaces. 
  // Handle Brazilian format: 1.200,50 -> remove dots, replace comma with dot
  // Handle US format: 1,200.50 -> remove commas
  
  if (str.includes(',') && str.includes('.')) {
     // Mixed format (likely thousands separator present)
     // Assume last separator is decimal
     const lastComma = str.lastIndexOf(',');
     const lastDot = str.lastIndexOf('.');
     
     if (lastComma > lastDot) {
        // PT-BR style: 1.000,00
        return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.'));
     } else {
        // US style: 1,000.00
        return parseFloat(str.replace(/[^\d.]/g, ''));
     }
  } else if (str.includes(',')) {
     // Likely PT-BR decimal: 120,50
     return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.'));
  }
  
  // Simple number or US style without thousands
  return parseFloat(str.replace(/[^\d.]/g, '')) || 0;
};

/**
 * Maps raw Excel JSON rows to SpectacleFrame objects using fuzzy column matching.
 */
export const mapExcelRowsToFrames = (rows: any[]): SpectacleFrame[] => {
  return rows.map(row => {
    // Helper to find value by possible column names
    const findValue = (possibleKeys: string[]): string | number | undefined => {
      const rowKeys = Object.keys(row);
      for (const pKey of possibleKeys) {
        // Exact match
        if (row[pKey] !== undefined) return row[pKey];
        // Normalized match
        const foundKey = rowKeys.find(k => normalizeKey(k) === normalizeKey(pKey));
        if (foundKey) return row[foundKey];
      }
      return undefined;
    };

    const brand = String(findValue(['Marca', 'Brand', 'Fabricante', 'Grife']) || 'Genérica');
    const modelCode = String(findValue(['Modelo', 'Model', 'Ref', 'Referência', 'Código', 'Code', 'Item']) || 'N/A');
    const colorCode = String(findValue(['Cor', 'Color', 'Cor Code', 'Color Code']) || '');
    const size = String(findValue(['Tamanho', 'Size', 'Largura', 'Tam']) || '');
    const ean = String(findValue(['EAN', 'UPC', 'Barras', 'Barcode', 'GTIN']) || '');
    
    // Dimensions logic
    // 1. Try to find explicit columns
    let lWidth = Number(findValue(['Largura Lente', 'Lens Width', 'Aro', 'Horizontal', 'Eye'])) || 0;
    let lHeight = Number(findValue(['Altura Lente', 'Lens Height', 'Vertical', 'Altura'])) || 0;
    let bridge = Number(findValue(['Ponte', 'Bridge', 'Nasal'])) || 0;
    let temple = Number(findValue(['Haste', 'Temple', 'Perna', 'Arm'])) || 0;

    // 2. If not found, try to parse from a combined string (e.g. "55-18-140")
    if (lWidth === 0) {
        const dimStr = String(findValue(['Medidas', 'Dimensions', 'Tam', 'Tamanho']) || '');
        // Matches: 55-18-140, 55 18 140, 55/18/140, 55x18x140
        const dimMatch = dimStr.match(/(\d{2})[\s\-\/\.x]+(\d{2})[\s\-\/\.x]+(\d{3})/);
        if (dimMatch) {
            lWidth = Number(dimMatch[1]);
            bridge = Number(dimMatch[2]);
            temple = Number(dimMatch[3]);
        }
    }

    // Prices
    const cost = parseCurrency(findValue(['Custo', 'Cost', 'Preço Compra', 'Purchase Price', 'Vlr Custo', 'Vlr. Compra']));
    const price = parseCurrency(findValue(['Preço', 'Price', 'Venda', 'Retail Price', 'Vlr Venda', 'Vlr. Unit.', 'P. Venda']));
    
    const quantity = Number(findValue(['Qtd', 'Qty', 'Quantidade', 'Estoque', 'Saldo'])) || 1;

    // Gender
    const genderRaw = String(findValue(['Gênero', 'Gender', 'Sexo', 'Categoria']) || '').toLowerCase();
    let gender = Gender.Unisex;
    if (genderRaw.includes('fem') || genderRaw.includes('woman') || genderRaw.includes('mulher')) gender = Gender.Female;
    else if (genderRaw.includes('masc') || genderRaw.includes('man') || genderRaw.includes('homem')) gender = Gender.Male;
    else if (genderRaw.includes('infant') || genderRaw.includes('child') || genderRaw.includes('kid')) gender = Gender.Child;

    return {
      id: uuidv4(),
      name: `${modelCode} ${colorCode}`.trim(),
      brand: brand,
      modelCode: modelCode,
      colorCode: colorCode,
      size: size || (lWidth > 0 ? String(lWidth) : ''),
      ean: ean,
      gender: gender,
      images: [],
      isSold: false,
      quantity: quantity,
      category: 'inventory',
      
      lensWidth: lWidth,
      lensHeight: lHeight,
      templeLength: temple,
      bridgeSize: bridge,
      
      frontColor: String(findValue(['Cor Frontal', 'Front Color']) || ''),
      frontMaterial: String(findValue(['Material Frontal', 'Front Material', 'Material']) || ''),
      templeMaterial: String(findValue(['Material Haste', 'Temple Material']) || ''),
      lensColor: String(findValue(['Cor Lente', 'Lens Color']) || ''),
      lensMaterial: String(findValue(['Material Lente', 'Lens Material']) || ''),
      isPolarized: String(findValue(['Polarizado', 'Polarized']) || '').toLowerCase().includes('sim'),

      purchasePrice: cost,
      storePrice: price,
      marketplacePrice: 0,
      createdAt: Date.now()
    };
  });
};

/**
 * Attempts to extract frames from PDF text using Regular Expressions (Offline).
 * Improved for better detection of Brazilian prices and Optical Dimensions.
 */
export const parsePDFTextOffline = (text: string): SpectacleFrame[] => {
  const frames: SpectacleFrame[] = [];
  const lines = text.split('\n');

  // Regex Patterns
  // 1. Model Code: Alphanumeric, uppercase, usually starts with letters, 3-10 chars.
  //    Avoids common words like "TOTAL", "PAGINA", "DATA".
  const modelRegex = /\b(?!TOTAL|VALOR|ITENS|DATA|PAGE)([A-Z0-9]{2,5}[-\s]?[0-9]{3,5}[A-Z]{0,2})\b/i;
  
  // 2. Dimensions Logic (Loose Regex): 
  //    Looks for: Two digits (40-70) + separator + Two digits (10-30) + separator + Three digits (115-155)
  //    Separators can be space, dash, dot, slash, or the square box [] often used in glasses.
  const dimRegex = /\b(4[0-9]|5[0-9]|6[0-9])[\s\-\[\.\]\/]+(1[0-9]|2[0-9])[\s\-\[\.\]\/]+(1[1-5][0-9])\b/;

  // 3. Price Logic (Brazilian Format):
  //    Looks for numbers with comma decimal, optional thousands dot, maybe R$ prefix.
  //    e.g. 1.200,00 | 350,50 | 59,90
  const priceRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})\b/;

  lines.forEach(line => {
    // Clean line
    const cleanLine = line.trim();
    if (cleanLine.length < 10) return;

    // Heuristic: A line represents a product if it has at least a model code
    const modelMatch = cleanLine.match(modelRegex);
    
    if (modelMatch) {
      const modelCode = modelMatch[1];
      
      // Try extracting Dimensions
      let lw = 0, bs = 0, tl = 0;
      const dimMatch = cleanLine.match(dimRegex);
      if (dimMatch) {
          lw = Number(dimMatch[1]);
          bs = Number(dimMatch[2]);
          tl = Number(dimMatch[3]);
      } else {
         // Fallback: Look for isolated numbers that fit the optical anatomy criteria
         // Lens: 45-65, Bridge: 12-24, Temple: 130-150
         // This helps when PDF extraction removed spaces or formatting
         const numbers = cleanLine.match(/\d+/g);
         if (numbers) {
            const potentialLens = numbers.find(n => Number(n) >= 45 && Number(n) <= 65);
            const potentialBridge = numbers.find(n => Number(n) >= 12 && Number(n) <= 24);
            const potentialTemple = numbers.find(n => Number(n) >= 130 && Number(n) <= 150);
            
            if (potentialLens) lw = Number(potentialLens);
            if (potentialBridge) bs = Number(potentialBridge);
            if (potentialTemple) tl = Number(potentialTemple);
         }
      }

      // Try extracting Price
      let cost = 0;
      const priceMatch = cleanLine.match(priceRegex);
      if (priceMatch) {
          // Parse PT-BR format
          cost = parseCurrency(priceMatch[1]);
      } else {
         // Fallback: Look for US format price at the end of the line
         const usPriceMatch = cleanLine.match(/(\d+\.\d{2})\b$/);
         if (usPriceMatch) {
            cost = parseFloat(usPriceMatch[1]);
         }
      }

      // Determine Gender
      let gender = Gender.Unisex;
      if (/feminin|woman|lady/i.test(cleanLine)) gender = Gender.Female;
      else if (/masculin|man/i.test(cleanLine)) gender = Gender.Male;
      else if (/infantil|kids/i.test(cleanLine)) gender = Gender.Child;

      // Brand Guessing
      let brand = "Genérica";
      if (/Ray-?Ban/i.test(cleanLine)) brand = "Ray-Ban";
      else if (/Oakley/i.test(cleanLine)) brand = "Oakley";
      else if (/Arnette/i.test(cleanLine)) brand = "Arnette";
      else if (/Vogue/i.test(cleanLine)) brand = "Vogue";
      else if (/Carrera/i.test(cleanLine)) brand = "Carrera";
      else if (/Prada/i.test(cleanLine)) brand = "Prada";
      else if (/Dolce/i.test(cleanLine)) brand = "Dolce & Gabbana";
      else if (/Armani/i.test(cleanLine)) brand = "Emporio Armani";

      // Final Check: Don't add if it looks like a header row
      if (/MODELO|CÓDIGO|DESCRIÇÃO/.test(cleanLine.toUpperCase())) return;

      frames.push({
        id: uuidv4(),
        name: modelCode,
        brand: brand,
        modelCode: modelCode,
        colorCode: '', 
        size: lw > 0 ? String(lw) : '',
        ean: '',
        gender: gender,
        images: [],
        isSold: false,
        quantity: 1,
        category: 'inventory',
        lensWidth: lw,
        lensHeight: 0,
        templeLength: tl,
        bridgeSize: bs,
        frontColor: '',
        frontMaterial: '',
        templeMaterial: '',
        lensColor: '',
        lensMaterial: '',
        isPolarized: /polariz/i.test(cleanLine),
        purchasePrice: cost,
        storePrice: 0,
        marketplacePrice: 0,
        createdAt: Date.now()
      });
    }
  });

  return frames;
};
