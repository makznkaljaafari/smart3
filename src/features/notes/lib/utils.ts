import React from 'react';
import { NoteCategory, NotePriority, NoteStatus } from '../../../types';
import {
  FileText, MessageSquare, CheckCircle, TrendingUp, Bell, User, Folder, Lock, AlertCircle
} from 'lucide-react';

export const CATEGORY_CONFIG: Record<NoteCategory, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  general: { label: 'عام', icon: FileText, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  meeting: { label: 'اجتماعات', icon: MessageSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  task: { label: 'مهام', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  idea: { label: 'أفكار', icon: TrendingUp, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  reminder: { label: 'تذكيرات', icon: Bell, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  customer: { label: 'عملاء', icon: User, color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  project: { label: 'مشاريع', icon: Folder, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  personal: { label: 'شخصي', icon: Lock, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  important: { label: 'مهم', icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' }
};

export const NOTE_COLORS = [
  { name: 'default', value: undefined, label: 'افتراضي' },
  { name: 'blue', value: '#3b82f633', label: 'أزرق' },
  { name: 'green', value: '#10b98133', label: 'أخضر' },
  { name: 'purple', value: '#8b5cf633', label: 'بنفسجي' },
  { name: 'orange', value: '#f9731633', label: 'برتقالي' },
  { name: 'pink', value: '#ec489933', label: 'وردي' },
  { name: 'gray', value: '#64748b33', label: 'رمادي' },
];

export const getPriorityClass = (priority: NotePriority) => {
    const classMap: Record<NotePriority, string> = {
        low: 'priority-low',
        medium: 'priority-medium',
        high: 'priority-high',
        urgent: 'priority-urgent'
    };
    return `priority-badge ${classMap[priority]}`;
};

export const getStatusClass = (status: NoteStatus) => {
    const classMap: Record<NoteStatus, string> = {
        active: 'status-success',
        draft: 'status-warning',
        completed: 'status-info',
        archived: 'status-neutral'
    };
    return `status-badge ${classMap[status]}`;
};

export const getPriorityLabel = (priority: NotePriority) => ({ low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' }[priority]);
export const getStatusLabel = (status: NoteStatus) => ({ active: 'نشط', archived: 'مؤرشف', completed: 'مكتمل', draft: 'مسودة' }[status]);

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString));
};

export const formatShortDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(new Date(dateString));
};