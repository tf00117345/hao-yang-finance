import { createContext, ReactNode, useContext } from 'react';

import { useMyPermissions } from '../hooks/useRole';
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
	const { data: userPermissions, isLoading, error } = useMyPermissions();

	const permissions = userPermissions?.permissions || [];
	const userRole = userPermissions?.role || '';

	const hasPermission = (permission: Permission): boolean => {
		return permissions.some((p) => p.name === permission);
	};

	const hasAnyPermission = (permissionList: Permission[]): boolean => {
		return permissionList.some((permission) => hasPermission(permission));
	};

	const hasAllPermissions = (permissionList: Permission[]): boolean => {
		return permissionList.every((permission) => hasPermission(permission));
	};

	const isAdmin = (): boolean => {
		return userRole === 'Admin';
	};

	const isAccountant = (): boolean => {
		return userRole === 'Accountant';
	};

	const isDriver = (): boolean => {
		return userRole === 'Driver';
	};

	const canManageUsers = (): boolean => {
		return hasPermission(Permission.UserRead);
	};

	const contextValue: PermissionContextType = {
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
	};

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
