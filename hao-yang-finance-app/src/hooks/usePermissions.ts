import { useAuth } from '../features/Auth/context/AuthContext';
import { Permission, UserRole } from '../types/permission.types';
import {
	canDelete,
	canEdit,
	canExportStatistics,
	canManageUsers,
	canViewStatistics,
	getPermissionsForRole,
	isAccountant,
	isAdmin,
	isManager,
	roleHasAllPermissions,
	roleHasAnyPermission,
	roleHasPermission,
} from '../utils/permissionUtils';

export interface UsePermissionsReturn {
	// Permission checking functions
	hasPermission: (permission: Permission) => boolean;
	hasAnyPermission: (permissions: Permission[]) => boolean;
	hasAllPermissions: (permissions: Permission[]) => boolean;

	// Role checking functions
	isAdmin: () => boolean;
	isManager: () => boolean;
	isAccountant: () => boolean;

	// Action checking functions
	canEdit: () => boolean;
	canDelete: () => boolean;
	canManageUsers: () => boolean;
	canViewStatistics: () => boolean;
	canExportStatistics: () => boolean;

	// Data access
	userRole: UserRole | null;
	userPermissions: Permission[];
	isAuthenticated: boolean;
}

/**
 * Hook for checking user permissions based on their role
 */
export const usePermissions = (): UsePermissionsReturn => {
	const { user, isAuthenticated } = useAuth();

	const userRole = (user?.role as UserRole) || null;
	const userPermissions = userRole ? getPermissionsForRole(userRole) : [];

	const hasPermission = (permission: Permission): boolean => {
		if (!isAuthenticated || !userRole) return false;
		return roleHasPermission(userRole, permission);
	};

	const hasAnyPermission = (permissions: Permission[]): boolean => {
		if (!isAuthenticated || !userRole) return false;
		return roleHasAnyPermission(userRole, permissions);
	};

	const hasAllPermissions = (permissions: Permission[]): boolean => {
		if (!isAuthenticated || !userRole) return false;
		return roleHasAllPermissions(userRole, permissions);
	};

	return {
		// Permission checking
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,

		// Role checking
		isAdmin: () => isAdmin(userRole),
		isManager: () => isManager(userRole),
		isAccountant: () => isAccountant(userRole),

		// Action checking
		canEdit: () => canEdit(userRole),
		canDelete: () => canDelete(userRole),
		canManageUsers: () => canManageUsers(userRole),
		canViewStatistics: () => canViewStatistics(userRole),
		canExportStatistics: () => canExportStatistics(userRole),

		// Data access
		userRole,
		userPermissions,
		isAuthenticated,
	};
};
