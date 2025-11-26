export enum Gender {
  Unisex = 'Unissex',
  Male = 'Masculino',
  Female = 'Feminino',
  Child = 'Infantil'
}

export type UserRole = 'Gerente Geral' | 'Administrador' | 'Visitante';

export interface UserAccount {
  id: string;
  username: string; // Login ID
  password?: string; // Optional for security when passing around UI, but needed for login check
  name: string; // Display Name
  role: UserRole;
  avatar: string | null;
  createdAt: number;
}

export interface SpectacleFrame {
  id: string;
  name: string;           // Nome gerado (Modelo + Cor)
  brand: string;          // Marca
  modelCode: string;      // Código do Modelo
  colorCode: string;      // Código da Cor
  size: string;           // Tamanho (Label)
  ean: string;            // Código EAN
  gender: Gender;         // Genero
  images: string[];       // Array de URLs (Base64) - Máximo 3
  isSold: boolean;        // Status de estoque (Vendido/Esgotado)
  category: 'inventory' | 'marketplace'; // Categoria do item
  hasMarketplaceListing?: boolean; // Flag indicating if item was moved to marketplace
  
  // Dimensions
  lensWidth: number;      // Largura da lente (mm)
  lensHeight: number;     // Altura da lente (mm)
  templeLength: number;   // Comprimento da haste (mm)
  bridgeSize: number;     // Tamanho da ponte (mm)

  // Materials & Characteristics (New Fields)
  frontColor: string;     // Cor da frente
  frontMaterial: string;  // Material da frente
  templeMaterial: string; // Material das hastes
  lensColor: string;      // Cor da Lente
  lensMaterial: string;   // Material da Lente
  isPolarized: boolean;   // Polarizado

  // Financial
  purchasePrice: number;    // Preço de Compra
  storePrice: number;       // Preço Venda Loja (Inventory) ou Preço Calculado (Marketplace)
  marketplacePrice: number; // (Deprecated/Unused but kept for type compatibility if needed)

  createdAt: number;
}