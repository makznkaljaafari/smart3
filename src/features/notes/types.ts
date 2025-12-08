export type NoteCategory = 
  | 'general'
  | 'meeting'
  | 'task'
  | 'idea'
  | 'reminder'
  | 'customer'
  | 'project'
  | 'personal'
  | 'important';

export type NotePriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteStatus = 'active' | 'archived' | 'completed' | 'draft';

export interface Note {
  id: string;
  company_id: string;
  title: string;
  content: string;
  category: NoteCategory;
  priority: NotePriority;
  status: NoteStatus;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isPrivate: boolean;
  hasReminder: boolean;
  reminderDate?: string;
  dueDate?: string;
  linkedCustomer?: string;
  linkedProject?: string;
  author: string;
  collaborators?: string[];
  createdDate: string;
  updatedDate: string;
  color?: string;
}