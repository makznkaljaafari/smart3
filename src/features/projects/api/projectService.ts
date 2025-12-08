import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase } from '../../../lib/utils';
import { Project } from '../types';
import { getStore } from '../../../lib/storeAccess';

const PROJECT_COLUMNS = 'id, company_id, name, description, status, startDate:start_date, endDate:end_date, budget, clientId:client_id, clientName:client_name, createdAt:created_at';

export const projectService = {
  async getProjects() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_COLUMNS)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async saveProject(projectData: Partial<Project>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company selected.") };
    
    const { totalIncome, totalExpenses, netProfit, ...restOfData } = projectData;

    const dataToSave = { ...restOfData, company_id: companyId };
    const snakeCaseData = keysToSnakeCase(dataToSave);

    if (isNew) {
        delete (snakeCaseData as any).id;
    }

    const query = isNew
      ? supabase.from('projects').insert(snakeCaseData)
      : supabase.from('projects').update(snakeCaseData).eq('id', projectData.id!);

    return await query.select(PROJECT_COLUMNS).single();
  },

  async deleteProject(projectId: string) {
    return await supabase.from('projects').delete().eq('id', projectId);
  },
};