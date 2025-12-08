
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Product, Warehouse, InventoryBatch, Stocktake } from '../types';
import { getStore } from '../../../lib/storeAccess';
import { journalService } from '../../../services/accounting/journalService';

// Updated columns to include new fields
const PRODUCT_COLUMNS = `
  id, company_id, sku, name, description, barcode, category, unit,
  cost_price, sale_price, currency,
  min_stock_level, reorder_point, is_active,
  image_url, tags, created_at,
  name_ar, name_en, item_number, serial_number, manufacturer, size, specifications,
  compatible_vehicles, alternative_part_numbers
`;

const WAREHOUSE_COLUMNS = 'id, company_id, name, code, location, is_primary';

const INVENTORY_VIEW_COLUMNS = `
  product_id, warehouse_id, company_id, 
  quantity, reserved_quantity, available_quantity
`;

const STOCKTAKE_COLUMNS = `
    id, company_id, warehouse_id, stocktake_date, 
    stocktake_type, status, notes, is_blind,
    warehouses(name)
`;

export interface GetProductsParams {
    page?: number;
    pageSize?: number;
    search?: string;
}

const mapProductRow = (row: any): Product => ({
    id: row.id,
    company_id: row.company_id,
    sku: row.sku,
    name: row.name,
    description: row.description || undefined,
    barcode: row.barcode || undefined,
    category: row.category || undefined,
    unit: row.unit || undefined,
    costPrice: row.cost_price,
    sellingPrice: row.sale_price,
    currency: (row.currency as any) || 'SAR',
    minStockLevel: row.min_stock_level,
    reorderPoint: row.reorder_point,
    isActive: row.is_active,
    imageUrl: row.image_url || undefined,
    tags: row.tags || undefined,
    created_at: row.created_at,
    nameAr: row.name_ar || undefined,
    nameEn: row.name_en || undefined,
    itemNumber: row.item_number || undefined,
    serialNumber: row.serial_number || undefined,
    manufacturer: row.manufacturer || undefined,
    size: row.size || undefined,
    specifications: row.specifications || undefined,
    compatibleVehicles: row.compatible_vehicles || [],
    alternativePartNumbers: row.alternative_part_numbers || []
});

export const inventoryService = {
  async getProducts() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('company_id', companyId)
      .order('name', { ascending: true });
      
    if (error) return { data: [], error };

    const mappedData = (data || []).map(mapProductRow);

    return { data: mappedData, error: null };
  },

  async getProductsPaginated({ page = 1, pageSize = 10, search = '' }: GetProductsParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('products')
        .select(PRODUCT_COLUMNS, { count: 'exact' })
        .eq('company_id', companyId);

      if (search) {
          query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%,item_number.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order('name', { ascending: true })
        .range(from, to);

      if (error) return { data: [], count: 0, error };
      
      const mappedData = (data || []).map(mapProductRow);

      return { data: mappedData, count: count || 0, error: null };
  },

  async checkExistingProducts(skus: string[]) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId || skus.length === 0) return { data: {}, error: null };

    // Batch check in chunks of 1000 to avoid URL length issues
    const chunkSize = 1000;
    let existingMap: Record<string, { id: string, name: string, sellingPrice: number }> = {};

    for (let i = 0; i < skus.length; i += chunkSize) {
        const chunk = skus.slice(i, i + chunkSize);
        const { data, error } = await supabase
            .from('products')
            .select('sku, id, name, sale_price')
            .eq('company_id', companyId)
            .in('sku', chunk);
            
        if (!error && data) {
            data.forEach((p: any) => {
                existingMap[p.sku] = { 
                    id: p.id, 
                    name: p.name, 
                    sellingPrice: p.sale_price 
                };
            });
        }
    }

    return { data: existingMap, error: null };
  },

  async getInventoryOverviewStats() {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };

      const { data: products } = await supabase.from('products').select('id, cost_price, reorder_point').eq('company_id', companyId);
      const { data: levels } = await supabase.from('vw_product_stock_per_warehouse').select('product_id, quantity').eq('company_id', companyId);

      if (!products || !levels) return { data: { totalValue: 0, lowStockCount: 0, totalSku: 0 }, error: null };

      const stockMap = new Map<string, number>();
      levels.forEach((l: any) => {
          const current = stockMap.get(l.product_id) || 0;
          stockMap.set(l.product_id, current + l.quantity);
      });

      let totalValue = 0;
      let lowStockCount = 0;

      products.forEach((p: any) => {
          const qty = stockMap.get(p.id) || 0;
          totalValue += qty * (p.cost_price || 0);
          if (p.reorder_point && qty <= p.reorder_point && qty > 0) {
              lowStockCount++;
          }
      });

      return { 
          data: { 
              totalValue, 
              lowStockCount, 
              totalSku: products.length 
          }, 
          error: null 
      };
  },
  
  async getBatchStockLevels(productIds: string[], warehouseId: string) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId || productIds.length === 0 || !warehouseId) return { data: [], error: null };

      const { data, error } = await supabase
          .from('vw_product_stock_per_warehouse')
          .select('product_id, quantity, available_quantity')
          .eq('company_id', companyId)
          .eq('warehouse_id', warehouseId)
          .in('product_id', productIds);
      
      const mapped = (data || []).map((d: any) => ({
          productId: d.product_id,
          quantity: d.quantity,
          availableQuantity: d.available_quantity
      }));

      return { data: mapped, error };
  },

  async getProductBatches(productId: string): Promise<{ data: InventoryBatch[], error: any }> {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], error: new Error("No active company") };

      const { data, error } = await supabase
          .from('inventory_batches')
          .select('*')
          .eq('product_id', productId)
          .eq('company_id', companyId)
          .gt('quantity', 0)
          .order('received_date', { ascending: true });

      if (error) return { data: [], error };

      const mappedBatches: InventoryBatch[] = data.map((b: any) => ({
          id: b.id,
          productId: b.product_id,
          warehouseId: b.warehouse_id,
          quantity: b.quantity,
          unitCost: b.unit_cost,
          receivedDate: b.received_date,
          expiryDate: b.expiry_date,
          purchaseInvoiceId: b.purchase_invoice_id
      }));

      return { data: mappedBatches, error: null };
  },

  async getAggregatedStockLevels(productIds: string[]) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId || productIds.length === 0) return { data: [], error: null };

      const { data, error } = await supabase
          .from('vw_product_stock_per_warehouse')
          .select('product_id, quantity')
          .eq('company_id', companyId)
          .in('product_id', productIds);
          
      if (error) return { data: [], error };
      
      const totals: Record<string, number> = {};
      (data || []).forEach((row: any) => {
          totals[row.product_id] = (totals[row.product_id] || 0) + row.quantity;
      });
      
      return { data: totals, error: null };
  },

  async getProductMovementHistory(productId: string) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], error: new Error("No active company") };

      const { data, error } = await supabase
          .from('inventory_movements')
          .select(`
              id, created_at, movement_type, quantity_change, reference_type, notes,
              warehouses(name)
          `)
          .eq('company_id', companyId)
          .eq('product_id', productId)
          .order('created_at', { ascending: false });
          
      if (error) return { data: [], error };
      
      const mappedData = (data || []).map((m: any) => ({
          id: m.id,
          date: m.created_at,
          type: m.movement_type,
          quantity: m.quantity_change,
          reference: m.reference_type,
          notes: m.notes,
          warehouseName: m.warehouses?.name || 'Unknown'
      }));
      
      return { data: mappedData, error: null };
  },

  async saveProduct(productData: Partial<Product>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company selected.") };
    
    const dataToSave: any = { 
        company_id: companyId,
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        barcode: productData.barcode,
        category: productData.category,
        unit: productData.unit,
        cost_price: productData.costPrice,
        sale_price: productData.sellingPrice,
        currency: productData.currency,
        min_stock_level: productData.minStockLevel,
        reorder_point: productData.reorderPoint,
        is_active: productData.isActive,
        image_url: productData.imageUrl,
        tags: productData.tags,
        name_ar: productData.nameAr,
        name_en: productData.nameEn,
        item_number: productData.itemNumber,
        serial_number: productData.serialNumber,
        manufacturer: productData.manufacturer,
        size: productData.size,
        specifications: productData.specifications,
        compatible_vehicles: productData.compatibleVehicles,
        alternative_part_numbers: productData.alternativePartNumbers
    };

    Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

    let result;

    if (isNew) {
        result = await supabase
            .from('products')
            .insert(dataToSave)
            .select(PRODUCT_COLUMNS)
            .single(); 
    } else {
        result = await supabase
            .from('products')
            .update(dataToSave)
            .eq('id', productData.id!)
            .select(PRODUCT_COLUMNS)
            .single();
    }
    
    if(result.error) return { data: null, error: result.error };
    
    return { data: [mapProductRow(result.data)], error: null };
  },
  
  // Optimized for bulk insert with upsert support
  async saveProductsBulk(products: Partial<Product>[]) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company selected.") };

      const dataToInsert = products.map(p => {
          const mapped = {
            company_id: companyId,
            sku: p.sku,
            name: p.name,
            description: p.description,
            cost_price: p.costPrice,
            sale_price: p.sellingPrice,
            currency: p.currency,
            item_number: p.itemNumber,
            manufacturer: p.manufacturer,
            name_ar: p.nameAr,
            name_en: p.nameEn,
            size: p.size,
            specifications: p.specifications,
            compatible_vehicles: p.compatibleVehicles,
            is_active: true
          };
          Object.keys(mapped).forEach(key => (mapped as any)[key] === undefined && delete (mapped as any)[key]);
          return mapped;
      });
      
      // Upsert: if SKU exists for company, update it. requires unique constraint on (company_id, sku)
      const { data, error } = await supabase
        .from('products')
        .upsert(dataToInsert, { onConflict: 'company_id,sku', ignoreDuplicates: false })
        .select('id');
        
      return { data, error };
  },

  async deleteProduct(productId: string) {
    return await supabase.from('products').delete().eq('id', productId);
  },
  
  async getWarehouses() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    return await supabase
      .from('warehouses')
      .select(WAREHOUSE_COLUMNS)
      .eq('company_id', companyId)
      .order('name', { ascending: true });
  },

  async saveWarehouse(warehouseData: Partial<Warehouse>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company selected.") };

    const dataToSave = { ...warehouseData, company_id: companyId };
    const snakeCaseData = keysToSnakeCase(dataToSave);
    
    if (isNew) {
        delete (snakeCaseData as any).id;
    }
    
    const query = isNew
      ? supabase.from('warehouses').insert(snakeCaseData)
      : supabase.from('warehouses').update(snakeCaseData).eq('id', warehouseData.id!);

    return await query.select(WAREHOUSE_COLUMNS).single();
  },
  
  async deleteWarehouse(warehouseId: string) {
    return await supabase.from('warehouses').delete().eq('id', warehouseId);
  },

  async getWarehouseContents(warehouseId: string) {
    const { data, error } = await supabase
      .from('vw_product_stock_per_warehouse')
      .select(`
        quantity,
        products ( ${PRODUCT_COLUMNS} )
      `)
      .eq('warehouse_id', warehouseId);
      
    if (error) {
      return { data: null, error };
    }
    
    const flattenedData = (data || []).map((item: any) => ({
        ...mapProductRow(item.products),
        quantity: item.quantity,
    }));
    
    return { data: flattenedData, error: null };
  },
  
  async getInventoryLevels() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vw_product_stock_per_warehouse')
      .select(INVENTORY_VIEW_COLUMNS)
      .eq('company_id', companyId);
      
    const mapped = (data || []).map((d: any) => ({
          productId: d.product_id,
          warehouseId: d.warehouse_id,
          company_id: d.company_id,
          quantity: d.quantity,
          reservedQuantity: d.reserved_quantity,
          availableQuantity: d.available_quantity
    }));

    return { data: mapped, error };
  },
  
  async adjustStockLevel(productId: string, warehouseId: string, newQuantity: number, adjustmentAccountId?: string) {
    const companyId = getStore().getState().currentCompany?.id;
    const user = getStore().getState().authUser;
    if (!companyId) return { data: null, error: new Error("No active company") };

    const { data: currentLevel } = await supabase
        .from('vw_product_stock_per_warehouse')
        .select('quantity')
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId)
        .single();

    const currentQty = currentLevel?.quantity || 0;
    const change = newQuantity - currentQty;
    
    if (change === 0) return { data: null, error: null };

    const { error } = await supabase.from('inventory_movements').insert({
        company_id: companyId,
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: 'adjustment',
        quantity_change: change,
        reference_type: 'manual_adjustment',
        notes: 'Manual stock adjustment via Quick Edit'
    });

    if (error) return { error };

    if (adjustmentAccountId) {
        const { data: product } = await supabase.from('products').select('cost_price').eq('id', productId).single();
        const cost = product?.cost_price || 0;
        const totalValue = Math.abs(change * cost);
        
        const inventoryAccountId = getStore().getState().settings.accounting.defaultInventoryAccountId;

        if (inventoryAccountId && totalValue > 0) {
            const lines = [];
            if (change > 0) {
                lines.push({ accountId: inventoryAccountId, debit: totalValue, credit: 0, note: 'Stock Gain' });
                lines.push({ accountId: adjustmentAccountId, debit: 0, credit: totalValue, note: 'Stock Gain Adjustment' });
            } else {
                lines.push({ accountId: adjustmentAccountId, debit: totalValue, credit: 0, note: 'Stock Loss/Shrinkage' });
                lines.push({ accountId: inventoryAccountId, debit: 0, credit: totalValue, note: 'Stock Loss' });
            }

            await journalService.saveJournalEntry({
                date: new Date().toISOString().split('T')[0],
                description: `Stock Adjustment for Product ${productId}`,
                createdBy: user?.name,
                referenceType: 'adjustment',
                lines: lines.map(l => ({ ...l, id: crypto.randomUUID() }))
            });
        }
    }

    return { data: true, error: null };
  },
  
  async recordBatchMovements(movements: { 
      productId: string, 
      warehouseId: string, 
      quantityChange: number, 
      movementType: 'purchase' | 'sale' | 'adjustment', 
      referenceType?: string, 
      referenceId?: string, 
      notes?: string
  }[]) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };

      const dataToInsert = movements.map(m => ({
          company_id: companyId,
          product_id: m.productId,
          warehouse_id: m.warehouseId,
          movement_type: m.movementType,
          quantity_change: m.quantityChange,
          reference_type: m.referenceType || null,
          reference_id: m.referenceId || null,
          notes: m.notes || null
      }));

      return await supabase.from('inventory_movements').insert(dataToInsert);
  },

  async getInventoryTransfers() {
      return { data: [], error: null }; 
  },

  async createInventoryTransfer(transferData: any) {
     return { data: null, error: new Error("Transfer logic not implemented in current schema") };
  },
  
  async completeInventoryTransfer(transferId: string) {
      return { data: null, error: new Error("Transfer logic not implemented") };
  },

  async getStocktakes() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
        .from('stocktakes')
        .select(STOCKTAKE_COLUMNS)
        .eq('company_id', companyId)
        .order('stocktake_date', { ascending: false });
    if (error) return { data: null, error };
    
    const mappedData = (data || []).map((d: any) => ({ 
        id: d.id,
        company_id: d.company_id,
        warehouseId: d.warehouse_id,
        stocktakeDate: d.stocktake_date,
        stocktakeType: d.stocktake_type,
        status: d.status,
        notes: d.notes,
        isBlind: d.is_blind,
        warehouseName: d.warehouses?.name 
    }));
    return { data: mappedData, error: null };
  },

  async getStocktakeDetails(stocktakeId: string) {
     const { data: stocktake, error: stError } = await supabase
        .from('stocktakes')
        .select(STOCKTAKE_COLUMNS)
        .eq('id', stocktakeId)
        .single();
     
     if(stError) return { data: null, error: stError };
     
     const { data: items, error: itError } = await supabase
        .from('stocktake_items')
        .select(`
            product_id, 
            system_quantity, 
            counted_quantity, 
            difference_quantity,
            products(${PRODUCT_COLUMNS})
        `)
        .eq('stocktake_id', stocktakeId);
        
     if(itError) return { data: null, error: itError };
     
     const fullStocktake = {
         id: stocktake.id,
         company_id: stocktake.company_id,
         warehouseId: stocktake.warehouse_id,
         stocktakeDate: stocktake.stocktake_date,
         stocktakeType: stocktake.stocktake_type,
         status: stocktake.status,
         notes: stocktake.notes,
         isBlind: stocktake.is_blind,
         warehouseName: stocktake.warehouses?.name,
         items: (items || []).map((i: any) => ({
             productId: i.product_id,
             systemQuantity: i.system_quantity,
             countedQuantity: i.counted_quantity,
             differenceQuantity: i.difference_quantity,
             product: i.products ? mapProductRow(i.products) : undefined,
             expectedQuantity: i.system_quantity
         }))
     };
     
     return { data: fullStocktake, error: null };
  },
  
  async createStocktake(warehouseId: string, isBlind: boolean) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: null, error: new Error("No active company") };

      const { data: stocktake, error } = await supabase.from('stocktakes').insert({
          company_id: companyId,
          warehouse_id: warehouseId,
          is_blind: isBlind,
          stocktake_date: new Date().toISOString(),
          stocktake_type: 'full',
          status: 'in_progress'
      }).select().single();
      
      if (error) return { data: null, error };
      
      const { data: levels } = await supabase
        .from('vw_product_stock_per_warehouse')
        .select('product_id, quantity')
        .eq('warehouse_id', warehouseId);
        
      if (levels) {
          const items = levels.map((l: any) => ({
              company_id: companyId,
              stocktake_id: stocktake.id,
              product_id: l.product_id,
              system_quantity: l.quantity,
              counted_quantity: 0
          }));
          await supabase.from('stocktake_items').insert(items);
      }
      
      return { data: stocktake, error: null };
  },

  async updateStocktakeItems(stocktakeId: string, items: { product_id: string, counted_quantity: number | null }[]) {
     const updates = items.map(item => 
         supabase
            .from('stocktake_items')
            .update({ counted_quantity: item.counted_quantity || 0 })
            .eq('stocktake_id', stocktakeId)
            .eq('product_id', item.product_id)
     );
     await Promise.all(updates);
     return { data: true, error: null };
  },
  
  async completeStocktake(stocktakeId: string) {
      const { error } = await supabase
        .from('stocktakes')
        .update({ status: 'completed' })
        .eq('id', stocktakeId);
      return { data: true, error };
  },

  async distributeLandedCost(purchaseId: string, amount: number, allocationMethod: 'value' | 'quantity' | 'weight') {
      console.log(`Distributing ${amount} via ${allocationMethod} to purchase ${purchaseId}`);
      return { success: true };
  }
};
