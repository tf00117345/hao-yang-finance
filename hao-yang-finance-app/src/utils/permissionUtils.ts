import { Permission, ROLE_PERMISSIONS, UserRole } from '../types/permission.types';

/**
 * Get permissions for a given role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
	return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
	const permissions = getPermissionsForRole(role);
	return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const roleHasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
	const userPermissions = getPermissionsForRole(role);
	return permissions.some((permission) => userPermissions.includes(permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const roleHasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
	const userPermissions = getPermissionsForRole(role);
	return permissions.every((permission) => userPermissions.includes(permission));
};

/**
 * Check if a role is admin
 */
export const isAdmin = (role?: string): boolean => {
	return role === 'Admin';
};

/**
 * Check if a role is manager or above (Manager or Admin)
 */
export const isManager = (role?: string): boolean => {
	return role === 'Manager' || role === 'Admin';
};

/**
 * Check if a role is accountant or above (Accountant, Manager, or Admin)
 */
export const isAccountant = (role?: string): boolean => {
	return role === 'Accountant' || role === 'Manager' || role === 'Admin';
};

/**
 * Check if a role can perform edit operations
 */
export const canEdit = (role?: string): boolean => {
	return role === 'Accountant' || role === 'Manager' || role === 'Admin';
};

/**
 * Check if a role can perform delete operations
 */
export const canDelete = (role?: string): boolean => {
	return role === 'Accountant' || role === 'Manager' || role === 'Admin';
};

/**
 * Check if a role can manage users
 */
export const canManageUsers = (role?: string): boolean => {
	return role === 'Admin';
};

/**
 * Check if a role can access statistics
 */
export const canViewStatistics = (role?: string): boolean => {
	return role === 'Accountant' || role === 'Manager' || role === 'Admin';
};

/**
 * Check if a role can export statistics
 */
export const canExportStatistics = (role?: string): boolean => {
	return role === 'Manager' || role === 'Admin';
};

/**
 * Get user-friendly permission description
 */
export const getPermissionDescription = (permission: Permission): string => {
	const descriptions: Record<Permission, string> = {
		[Permission.WaybillRead]: '查看託運單',
		[Permission.WaybillCreate]: '新增託運單',
		[Permission.WaybillUpdate]: '編輯託運單',
		[Permission.WaybillDelete]: '刪除託運單',
		[Permission.InvoiceRead]: '查看發票',
		[Permission.InvoiceCreate]: '新增發票',
		[Permission.InvoiceUpdate]: '編輯發票',
		[Permission.InvoiceDelete]: '刪除發票',
		[Permission.InvoiceVoid]: '作廢發票',
		[Permission.InvoiceMarkPaid]: '標記發票已付款',
		[Permission.CompanyRead]: '查看公司',
		[Permission.CompanyCreate]: '新增公司',
		[Permission.CompanyUpdate]: '編輯公司',
		[Permission.CompanyDelete]: '刪除公司',
		[Permission.DriverRead]: '查看司機',
		[Permission.DriverCreate]: '新增司機',
		[Permission.DriverUpdate]: '編輯司機',
		[Permission.DriverDelete]: '刪除司機',
		[Permission.StatisticsRead]: '查看統計報表',
		[Permission.StatisticsExport]: '匯出統計資料',
		[Permission.UserRead]: '查看使用者',
		[Permission.UserCreate]: '新增使用者',
		[Permission.UserUpdate]: '編輯使用者',
		[Permission.UserDelete]: '刪除使用者',
		[Permission.UserChangeRole]: '變更使用者角色',
		[Permission.UserChangeStatus]: '啟用/停用使用者',
	};

	return descriptions[permission] || permission;
};

/**
 * Get user-friendly role description
 */
export const getRoleDescription = (role: UserRole): string => {
	const descriptions: Record<UserRole, string> = {
		Admin: '系統管理員',
		Manager: '經理',
		Accountant: '會計',
		User: '一般使用者',
	};

	return descriptions[role] || role;
};
