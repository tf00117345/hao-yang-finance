import React, { ReactNode } from 'react';

import { usePermission } from '../../contexts/PermissionContext';
import { Permission } from '../../types/permission.types';

interface PermissionGuardProps {
	children: ReactNode;
	permission?: Permission;
	permissions?: Permission[];
	requireAll?: boolean; // true = 需要所有權限, false = 需要任一權限 (default)
	role?: string;
	roles?: string[];
	fallback?: ReactNode;
	hideWhenNoPermission?: boolean; // true = 沒權限時隱藏, false = 顯示 fallback (default)
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
	children,
	permission,
	permissions,
	requireAll = false,
	role,
	roles,
	fallback = null,
	hideWhenNoPermission = false,
}) => {
	const { hasPermission, hasAnyPermission, hasAllPermissions, userRole } = usePermission();

	// 檢查單一權限
	if (permission && !hasPermission(permission)) {
		return hideWhenNoPermission ? null : <>{fallback}</>;
	}

	// 檢查多個權限
	if (permissions && permissions.length > 0) {
		const hasRequiredPermissions = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);

		if (!hasRequiredPermissions) {
			return hideWhenNoPermission ? null : <>{fallback}</>;
		}
	}

	// 檢查單一角色
	if (role && userRole !== role) {
		return hideWhenNoPermission ? null : <>{fallback}</>;
	}

	// 檢查多個角色
	if (roles && roles.length > 0 && !roles.includes(userRole)) {
		return hideWhenNoPermission ? null : <>{fallback}</>;
	}

	return <>{children}</>;
};

export default PermissionGuard;
