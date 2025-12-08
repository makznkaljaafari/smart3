import { supabase } from '../../../lib/supabaseClient';
import { useZustandStore } from '../../../store/useStore';
import { UserCompanyRole, TeamMember } from '../types';

export const teamService = {
  async getTeamMembers(companyId: string) {
    try {
      const { data, error } = await supabase.rpc('get_team_members', {
        p_company_id: companyId,
      });
      
      if (!error && data) {
        return { data: data as TeamMember[], error: null };
      }
    } catch (e) {
      // Fallback handled below
    }

    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_company_roles')
        .select(`
          user_id,
          role,
          created_at,
          users (
            id,
            full_name,
            email
          )
        `)
        .eq('company_id', companyId);

      if (roleData) {
        const members: TeamMember[] = roleData.map((row: any) => ({
          id: row.user_id,
          role: row.role,
          joinedAt: row.created_at,
          full_name: row.users?.full_name || 'Unknown User',
          email: row.users?.email || '',
          avatar_url: null 
        }));
        return { data: members, error: null };
      }
    } catch (e) {
        // Fallback
    }

    try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, email, created_at')
          .eq('company_id', companyId);

        if (userData) {
            const members: TeamMember[] = userData.map((u: any) => ({
                id: u.id,
                role: 'employee',
                joinedAt: u.created_at,
                full_name: u.full_name || 'User',
                email: u.email || '',
                avatar_url: null
            }));
            return { data: members, error: null };
        }
        return { data: [], error: userError };
    } catch (e: any) {
        return { data: [], error: new Error(e.message || "Fetch failed") };
    }
  },

  async inviteMember(email: string, role: UserCompanyRole['role'], password: string) {
    const companyId = useZustandStore.getState().currentCompany?.id;
    if (!companyId) {
      return { data: null, error: new Error("No active company selected.") };
    }

    return await supabase.rpc('invite_team_member', {
      p_company_id: companyId,
      p_email: email,
      p_role: role,
      p_password: password,
    });
  },

  async acceptInvite(token: string) {
    return await supabase.rpc('accept_invitation', {
      p_token: token,
    });
  },

  async removeMember(userIdToRemove: string) {
    const companyId = useZustandStore.getState().currentCompany?.id;
    if (!companyId) {
      return { data: null, error: new Error("No active company selected.") };
    }

    return await supabase.rpc('remove_team_member', {
      p_user_id_to_remove: userIdToRemove,
      p_company_id: companyId,
    });
  },
};