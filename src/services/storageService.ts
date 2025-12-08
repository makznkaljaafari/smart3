import { supabase } from '../lib/supabaseClient';
import { useZustandStore } from '../store/useStore';

export const storageService = {
  /**
   * Uploads a file to a company-specific folder in Supabase Storage.
   * @param file The file to upload.
   * @returns A promise that resolves to an object containing the public URL or an error.
   */
  async uploadAttachment(file: File): Promise<{ publicUrl: string | null; error: Error | null }> {
    const companyId = useZustandStore.getState().currentCompany?.id;
    if (!companyId) {
      return { publicUrl: null, error: new Error("No active company selected.") };
    }

    const filePath = `${companyId}/${crypto.randomUUID()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { publicUrl: null, error: uploadError as unknown as Error };
    }

    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return { publicUrl: data.publicUrl, error: null };
  }
};
