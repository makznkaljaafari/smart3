
import { CurrencyCode } from '../../types.base';

export interface Warehouse {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  location?: string;
  is_primary?: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  sku: string; // Stock Keeping Unit
  name: string; // Default display name
  description?: string;
  barcode?: string;
  category?: string;
  unit?: string;
  
  costPrice: number; // Maps to cost_price
  sellingPrice: number; // Maps to sale_price
  currency: CurrencyCode;
  
  minStockLevel?: number; // Maps to min_stock_level
  reorderPoint?: number; // Maps to reorder_point
  isActive: boolean; // Maps to is_active
  
  imageUrl?: string; // Maps to image_url
  tags?: string[];

  // New Detailed Fields
  nameAr?: string; 
  nameEn?: string;
  itemNumber?: string; 
  serialNumber?: string;
  manufacturer?: string; 
  size?: string; 
  specifications?: string;
  compatibleVehicles?: string[]; // Array of strings
  alternativePartNumbers?: string[]; // Array of strings
  created_at?: string;
}

export interface InventoryLevel {
  productId: string;
  warehouseId: string;
  company_id: string;
  quantity: number;
  reservedQuantity?: number; // Maps to reserved_quantity
  availableQuantity?: number; // Maps to available_quantity
}

export interface InventoryBatch {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  receivedDate: string;
  expiryDate?: string;
  purchaseInvoiceId?: string;
}

export interface WarehouseStockItem extends Product {
    quantity: number;
}

export interface InventoryTransfer {
  id: string;
  company_id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromWarehouseName?: string; 
  toWarehouseName?: string; 
  transferDate: string; 
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  items: InventoryTransferItem[];
}

export interface InventoryTransferItem {
  productId: string;
  productName?: string; 
  quantity: number;
}

// Updated to match DB Enum: 'full', 'category', 'items'
export type StocktakeType = 'full' | 'category' | 'items';

// Updated to match DB Enum: 'draft', 'in_progress', 'completed', 'cancelled'
export type StocktakeStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface Stocktake {
  id: string;
  company_id: string;
  warehouseId: string;
  warehouseName?: string; 
  stocktakeDate: string; // ISO String
  stocktakeType: StocktakeType;
  status: StocktakeStatus;
  notes?: string;
  items: StocktakeItem[];
  isBlind?: boolean; 
}

export interface StocktakeItem {
  productId: string;
  product?: Product; 
  systemQuantity: number; // Maps to system_quantity
  countedQuantity: number | null; // Maps to counted_quantity
  differenceQuantity: number; // Maps to difference_quantity
  // Legacy mappings for frontend compatibility
  expectedQuantity: number; 
}
