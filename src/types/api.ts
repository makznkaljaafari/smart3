
export type ServiceResponse<T> = 
  | { data: T; error: null; count?: number }
  | { data: null; error: Error; count?: number };

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: Error | null;
}
