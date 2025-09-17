import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { useAuth } from '../features/Auth/context/AuthContext';
import { Permission } from '../types/permission.types';
import { PermissionDto } from '../types/role.types';

interface PermissionContextType {
	permissions: PermissionDto[];
	userRole: string;
	hasPermission: (permission: Permission) => boolean;
	hasAnyPermission: (permissions: Permission[]) => boolean;
	hasAllPermissions: (permissions: Permission[]) => boolean;
	isAdmin: () => boolean;
	isAccountant: () => boolean;
	isDriver: () => boolean;
	canManageUsers: () => boolean;
	isLoading: boolean;
	error: any;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
	children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
	const { permissions, permissionsLoading, user } = useAuth();

	const userRole = user?.role || '';
	const isLoading = permissionsLoading;
	const error = null; // Auth context handles errors

	const hasPermission = useCallback(
		(permission: Permission): boolean => {
			return permissions.some((p) => p.name === permission);
		},
		[permissions],
	);

	const hasAnyPermission = useCallback(
		(permissionList: Permission[]): boolean => {
			return permissionList.some((permission) => hasPermission(permission));
		},
		[hasPermission],
	);

	const hasAllPermissions = useCallback(
		(permissionList: Permission[]): boolean => {
			return permissionList.every((permission) => hasPermission(permission));
		},
		[hasPermission],
	);

	const isAdmin = useCallback((): boolean => {
		return userRole === 'Admin';
	}, [userRole]);

	const isAccountant = useCallback((): boolean => {
		return userRole === 'Accountant';
	}, [userRole]);

	const isDriver = useCallback((): boolean => {
		return userRole === 'Driver';
	}, [userRole]);

	const canManageUsers = useCallback((): boolean => {
		return hasPermission(Permission.UserRead);
	}, [hasPermission]);

	const contextValue: PermissionContextType = useMemo(
		() => ({
			permissions,
			userRole,
			hasPermission,
			hasAnyPermission,
			hasAllPermissions,
			isAdmin,
			isAccountant,
			isDriver,
			canManageUsers,
			isLoading,
			error,
		}),
		[
			permissions,
			userRole,
			hasPermission,
			hasAnyPermission,
			hasAllPermissions,
			isAdmin,
			isAccountant,
			isDriver,
			canManageUsers,
			isLoading,
			error,
		],
	);

	return <PermissionContext.Provider value={contextValue}>{children}</PermissionContext.Provider>;
}

export const usePermission = (): PermissionContextType => {
	const context = useContext(PermissionContext);
	if (context === undefined) {
		throw new Error('usePermission must be used within a PermissionProvider');
	}
	return context;
};

export { PermissionContext };
