
import { supabase } from '../../../lib/supabaseClient';
import { FixedAsset, JournalEntry } from '../../accounting/types';
import { getStore } from '../../../lib/storeAccess';
import { journalService } from './journalService';

export const fixedAssetService = {
  /**
   * Fetches all fixed assets.
   */
  async getAssets() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('fixed_assets')
      .select('*')
      .eq('company_id', companyId)
      .order('purchase_date', { ascending: false });

    if (error) {
        return { data: [], error };
    }

    const mappedData: FixedAsset[] = data.map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        name: row.name,
        assetNumber: row.asset_number,
        purchaseDate: row.purchase_date,
        cost: row.cost,
        salvageValue: row.salvage_value,
        usefulLifeMonths: row.useful_life_months,
        depreciationMethod: row.depreciation_method,
        status: row.status,
        assetAccountId: row.asset_account_id,
        accumulatedDepreciationAccountId: row.accumulated_depreciation_account_id,
        depreciationExpenseAccountId: row.depreciation_expense_account_id,
        currentBookValue: row.current_book_value || row.cost,
        totalDepreciated: row.total_depreciated || 0,
        lastDepreciationDate: row.last_depreciation_date
    }));

    return { data: mappedData, error: null };
  },

  /**
   * Calculates depreciation for a single asset for a given month.
   * Using Straight-Line Method: (Cost - Salvage) / Life
   */
  calculateMonthlyDepreciation(asset: FixedAsset): number {
    if (asset.status !== 'active') return 0;
    
    const depreciableAmount = asset.cost - asset.salvageValue;
    const monthlyAmount = depreciableAmount / asset.usefulLifeMonths;
    
    // Ensure we don't over-depreciate
    const remainingValue = asset.currentBookValue !== undefined ? asset.currentBookValue : asset.cost;
    // Minimum book value shouldn't go below salvage value
    const limit = Math.max(0, remainingValue - asset.salvageValue);

    return Math.min(monthlyAmount, limit);
  },

  /**
   * Saves (Create/Update) an asset.
   */
  async saveAsset(assetData: Partial<FixedAsset>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { error: new Error("No company") };
    
    const payload = {
        company_id: companyId,
        name: assetData.name,
        asset_number: assetData.assetNumber,
        purchase_date: assetData.purchaseDate,
        cost: assetData.cost,
        salvage_value: assetData.salvageValue,
        useful_life_months: assetData.usefulLifeMonths,
        depreciation_method: assetData.depreciationMethod,
        status: assetData.status || 'active',
        asset_account_id: assetData.assetAccountId,
        accumulated_depreciation_account_id: assetData.accumulatedDepreciationAccountId,
        depreciation_expense_account_id: assetData.depreciationExpenseAccountId,
        current_book_value: isNew ? assetData.cost : undefined // Only set on create
    };
    
    // Remove undefined fields
    Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

    if (isNew) {
        return await supabase.from('fixed_assets').insert(payload);
    } else {
        return await supabase.from('fixed_assets').update(payload).eq('id', assetData.id);
    }
  },

  /**
   * Runs the monthly depreciation for ALL eligible assets and creates ONE compound journal entry.
   */
  async runMonthlyDepreciation(date: string) {
    const { data: assets } = await this.getAssets();
    if (!assets || assets.length === 0) return { count: 0 };

    const companyId = getStore().getState().currentCompany?.id!;
    const user = getStore().getState().authUser;

    const journalLines: any[] = [];
    let totalAmount = 0;
    let processedCount = 0;
    const assetUpdates: Promise<any>[] = [];

    for (const asset of assets) {
        const amount = this.calculateMonthlyDepreciation(asset);
        // Only proceed if depreciation amount is significant (e.g. > 0.01)
        if (amount > 0.01) {
            // Debit Expense
            journalLines.push({
                accountId: asset.depreciationExpenseAccountId,
                debit: amount,
                credit: 0,
                note: `Depreciation: ${asset.name} (${asset.assetNumber})`
            });
            // Credit Accumulated Depreciation
            journalLines.push({
                accountId: asset.accumulatedDepreciationAccountId,
                debit: 0,
                credit: amount,
                note: `Depreciation: ${asset.name} (${asset.assetNumber})`
            });
            
            totalAmount += amount;
            processedCount++;

            // Prepare asset update
            const newBookValue = (asset.currentBookValue || asset.cost) - amount;
            const newTotalDepreciated = (asset.totalDepreciated || 0) + amount;
            
            assetUpdates.push(
                supabase.from('fixed_assets').update({
                    current_book_value: newBookValue,
                    total_depreciated: newTotalDepreciated,
                    last_depreciation_date: date
                }).eq('id', asset.id)
            );
        }
    }

    if (totalAmount > 0) {
        // Create one journal entry
        const entry: Omit<JournalEntry, 'id' | 'company_id'> = {
            date: date,
            description: `Monthly Depreciation Run - ${new Date(date).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
            createdBy: user?.name || 'System',
            referenceType: 'depreciation',
            lines: journalLines.map(l => ({...l, id: crypto.randomUUID()}))
        };

        const { error } = await journalService.saveJournalEntry(entry);
        
        if (!error) {
            // Only update assets if journal entry succeeded
            await Promise.all(assetUpdates);
        } else {
            throw error;
        }
    }

    return { count: processedCount, totalAmount };
  }
};
