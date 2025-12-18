import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

export const AdminService = {
    getUsers: async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase!.rpc('get_users_for_admin');
        if (error) throw error;
        return data;
    },

    setUserRole: async (userId: string, role: 'admin' | 'explorer') => {
        const { error } = await supabase!.rpc('set_user_role', {
            target_user_id: userId,
            new_role: role
        });
        if (error) throw error;
    }
};
