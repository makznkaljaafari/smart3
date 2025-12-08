export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface UserCompanyRole {
  user_id: string;
  company_id: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
}

export interface TeamMember {
    id: string; // This is the user_id from profiles
    role: 'owner' | 'admin' | 'manager' | 'employee';
    joinedAt: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
}
