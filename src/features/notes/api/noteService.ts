
import { supabase } from '../../../lib/supabaseClient';
import { keysToSnakeCase, toSnakeCase } from '../../../lib/utils';
import { Note, NoteCategory, NoteStatus } from '../types';
import { getStore } from '../../../lib/storeAccess';

const NOTE_COLUMNS = 'id, company_id, title, content, category, priority, status, tags, isPinned:is_pinned, isFavorite:is_favorite, isPrivate:is_private, hasReminder:has_reminder, reminderDate:reminder_date, dueDate:due_date, linkedCustomer:linked_customer, linkedProject:linked_project, author, collaborators, createdDate:created_date, updatedDate:updated_date, color';

export interface GetNotesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: NoteCategory | 'all';
    status?: NoteStatus | 'all';
    dateFrom?: string;
    dateTo?: string;
}

/**
 * Service object for all note-related database operations.
 */
export const noteService = {
  /**
   * Fetches paginated notes for the current company.
   */
  async getNotesPaginated({ 
      page = 1, 
      pageSize = 10, 
      search = '', 
      category = 'all', 
      status = 'all',
      dateFrom,
      dateTo
  }: GetNotesParams) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

    let query = supabase
      .from('notes')
      .select(NOTE_COLUMNS, { count: 'exact' })
      .eq('company_id', companyId);

    if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    if (category !== 'all') {
        query = query.eq('category', category);
    }
    
    if (status !== 'all') {
        query = query.eq('status', status);
    }
    
    if (dateFrom) query = query.gte('updated_date', dateFrom);
    if (dateTo) query = query.lte('updated_date', dateTo);

    // Order by pinned first, then updated date
    query = query.order('is_pinned', { ascending: false })
                 .order('updated_date', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    return { data: (data as Note[]) || [], count: count || 0, error };
  },

  /**
   * Fetches all notes for the current company (Legacy).
   * @deprecated Use getNotesPaginated
   */
  async getNotes() {
    return this.getNotesPaginated({ page: 1, pageSize: 1000 });
  },

  /**
   * Creates or updates a note in the database.
   * @param noteData The partial note data to save.
   * @param isNew A boolean flag indicating if this is a new record.
   * @returns A promise that resolves to the result of the database operation.
   */
  async saveNote(noteData: Partial<Note>, isNew: boolean) {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company selected.") };
    
    const dataToSave = { ...noteData, company_id: companyId };
    const snakeCaseData = keysToSnakeCase(dataToSave);
    
    if (isNew) {
        delete (snakeCaseData as any).id;
        return await supabase.from('notes').insert(snakeCaseData);
    } else {
        return await supabase.from('notes').update(snakeCaseData).eq('id', noteData.id!);
    }
  },

  /**
   * Deletes a note from the database.
   * @param noteId The ID of the note to delete.
   * @returns A promise that resolves to the result of the delete operation.
   */
  async deleteNote(noteId: string) {
    return await supabase.from('notes').delete().eq('id', noteId);
  },

  /**
   * Toggles a boolean field (e.g., isPinned, isFavorite) on a note.
   * @param noteId The ID of the note to update.
   * @param key The field to toggle ('isPinned' or 'isFavorite').
   * @param value The new boolean value.
   * @returns A promise that resolves to the result of the update operation.
   */
  async toggleNote(noteId: string, key: 'isPinned' | 'isFavorite', value: boolean) {
    const snakeCaseKey = toSnakeCase(key);
    return await supabase.from('notes').update({ [snakeCaseKey]: value }).eq('id', noteId);
  }
};
