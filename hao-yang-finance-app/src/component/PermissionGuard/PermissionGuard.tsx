import React from 'react';

import { Alert } from '@mui/material';

import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permission.types';

interface PermissionGuardProps {
	children: React.ReactNode;
	permission?: Permission;
	permissions?: Permission[];
	requireAll?: boolean; // Whether to require ALL permissions or just ANY
	adminOnly?: boolean;
	managerOnly?: boolean;
	accountantOnly?: boolean;
	fallback?: React.ReactNode;
	showDeniedMessage?: boolean;
	deniedMessage?: string;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
	children,
	permission,
	permissions = [],
	requireAll = false,
	adminOnly = false,
	managerOnly = false,
	accountantOnly = false,
	fallback = null,
	showDeniedMessage = false,
	deniedMessage = '您沒有權限執行此操作',
}: PermissionGuardProps) {
	const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isManager, isAccountant, isAuthenticated } =
		usePermissions();

	// Check if user is authenticated
	if (!isAuthenticated) {
		if (showDeniedMessage) {
			return <Alert severity="warning">請先登入以查看此內容</Alert>;
		}
		return <>{fallback}</>;
	}

	// Check role-based access
	if (adminOnly && !isAdmin()) {
		if (showDeniedMessage) {
			return <Alert severity="error">此功能僅限系統管理員使用</Alert>;
		}
		return <>{fallback}</>;
	}

	if (managerOnly && !isManager()) {
		if (showDeniedMessage) {
			return <Alert severity="error">此功能僅限經理以上層級使用</Alert>;
		}
		return <>{fallback}</>;
	}

	if (accountantOnly && !isAccountant()) {
		if (showDeniedMessage) {
			return <Alert severity="error">此功能僅限會計以上層級使用</Alert>;
		}
		return <>{fallback}</>;
	}

	// Check specific permission
	if (permission && !hasPermission(permission)) {
		if (showDeniedMessage) {
			return <Alert severity="error">{deniedMessage}</Alert>;
		}
		return <>{fallback}</>;
	}

	// Check multiple permissions
	if (permissions.length > 0) {
		const hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);

		if (!hasAccess) {
			if (showDeniedMessage) {
				return <Alert severity="error">{deniedMessage}</Alert>;
			}
			return <>{fallback}</>;
		}
	}

	// User has required permissions, render children
	return <>{children}</>;
}

/**
 * Higher-order component version of PermissionGuard
 */
export function withPermissionGuard<P extends object>(
	Component: React.ComponentType<P>,
	guardProps: Omit<PermissionGuardProps, 'children'>,
) {
	function WrappedComponent(props: P) {
		return (
			<PermissionGuard {...guardProps}>
				<Component {...props} />
			</PermissionGuard>
		);
	}
}

/**
 * Component for showing different content based on permissions
 */
interface PermissionSwitchProps {
	admin?: React.ReactNode;
	manager?: React.ReactNode;
	accountant?: React.ReactNode;
	user?: React.ReactNode;
	fallback?: React.ReactNode;
}

export function PermissionSwitch({ admin, manager, accountant, user, fallback = null }: PermissionSwitchProps) {
	const { isAdmin, isManager, isAccountant, isAuthenticated } = usePermissions();

	if (!isAuthenticated) {
		return <>{fallback}</>;
	}

	if (isAdmin() && admin) {
		return <>{admin}</>;
	}

	if (isManager() && manager) {
		return <>{manager}</>;
	}

	if (isAccountant() && accountant) {
		return <>{accountant}</>;
	}

	if (user) {
		return <>{user}</>;
	}

	return <>{fallback}</>;
}

/**
 * Component for conditionally rendering action buttons
 */
interface PermissionButtonProps {
	children: React.ReactNode;
	permission?: Permission;
	permissions?: Permission[];
	requireAll?: boolean;
	adminOnly?: boolean;
	managerOnly?: boolean;
	accountantOnly?: boolean;
	tooltip?: string;
}

export function PermissionButton(props: PermissionButtonProps) {
	return <PermissionGuard {...props}>{props.children}</PermissionGuard>;
}
