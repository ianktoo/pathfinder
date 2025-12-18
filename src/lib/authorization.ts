import { UserProfile } from '../types';

export const AuthorizationUtils = {
    isAdmin: (user: UserProfile | null | undefined): boolean => {
        return user?.role === 'admin';
    },

    canManageUsers: (user: UserProfile | null | undefined): boolean => {
        return AuthorizationUtils.isAdmin(user);
    },

    canViewAdminPanel: (user: UserProfile | null | undefined): boolean => {
        return AuthorizationUtils.isAdmin(user);
    },

    // Safe role check that defaults to false if anything is ambiguous
    hasRole: (user: UserProfile | null | undefined, role: 'admin' | 'explorer'): boolean => {
        return user?.role === role;
    }
};
