export enum Permission {
	// Waybill permissions
	WaybillRead = 'WaybillRead',
	WaybillCreate = 'WaybillCreate',
	WaybillUpdate = 'WaybillUpdate',
	WaybillDelete = 'WaybillDelete',

	// Invoice permissions
	InvoiceRead = 'InvoiceRead',
	InvoiceCreate = 'InvoiceCreate',
	InvoiceUpdate = 'InvoiceUpdate',
	InvoiceDelete = 'InvoiceDelete',
	InvoiceVoid = 'InvoiceVoid',
	InvoiceMarkPaid = 'InvoiceMarkPaid',

	// Company permissions
	CompanyRead = 'CompanyRead',
	CompanyCreate = 'CompanyCreate',
	CompanyUpdate = 'CompanyUpdate',
	CompanyDelete = 'CompanyDelete',

	// Driver permissions
	DriverRead = 'DriverRead',
	DriverCreate = 'DriverCreate',
	DriverUpdate = 'DriverUpdate',
	DriverDelete = 'DriverDelete',

	// Statistics permissions
	StatisticsRead = 'StatisticsRead',
	StatisticsExport = 'StatisticsExport',

	// User management permissions (Admin only)
	UserRead = 'UserRead',
	UserCreate = 'UserCreate',
	UserUpdate = 'UserUpdate',
	UserDelete = 'UserDelete',
	UserChangeRole = 'UserChangeRole',
	UserChangeStatus = 'UserChangeStatus',
}

export type UserRole = 'Admin' | 'Manager' | 'Accountant' | 'User';

export interface RolePermissions {
	[key: string]: Permission[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
	Admin: [
		// All permissions
		Permission.WaybillRead,
		Permission.WaybillCreate,
		Permission.WaybillUpdate,
		Permission.WaybillDelete,
		Permission.InvoiceRead,
		Permission.InvoiceCreate,
		Permission.InvoiceUpdate,
		Permission.InvoiceDelete,
		Permission.InvoiceVoid,
		Permission.InvoiceMarkPaid,
		Permission.CompanyRead,
		Permission.CompanyCreate,
		Permission.CompanyUpdate,
		Permission.CompanyDelete,
		Permission.DriverRead,
		Permission.DriverCreate,
		Permission.DriverUpdate,
		Permission.DriverDelete,
		Permission.StatisticsRead,
		Permission.StatisticsExport,
		Permission.UserRead,
		Permission.UserCreate,
		Permission.UserUpdate,
		Permission.UserDelete,
		Permission.UserChangeRole,
		Permission.UserChangeStatus,
	],
	Manager: [
		Permission.WaybillRead,
		Permission.WaybillCreate,
		Permission.WaybillUpdate,
		Permission.WaybillDelete,
		Permission.InvoiceRead,
		Permission.InvoiceCreate,
		Permission.InvoiceUpdate,
		Permission.InvoiceDelete,
		Permission.InvoiceVoid,
		Permission.InvoiceMarkPaid,
		Permission.CompanyRead,
		Permission.CompanyCreate,
		Permission.CompanyUpdate,
		Permission.CompanyDelete,
		Permission.DriverRead,
		Permission.DriverCreate,
		Permission.DriverUpdate,
		Permission.DriverDelete,
		Permission.StatisticsRead,
		Permission.StatisticsExport,
	],
	Accountant: [
		Permission.WaybillRead,
		Permission.WaybillCreate,
		Permission.WaybillUpdate,
		Permission.WaybillDelete,
		Permission.InvoiceRead,
		Permission.InvoiceCreate,
		Permission.InvoiceUpdate,
		Permission.InvoiceDelete,
		Permission.InvoiceVoid,
		Permission.InvoiceMarkPaid,
		Permission.CompanyRead,
		Permission.CompanyCreate,
		Permission.CompanyUpdate,
		Permission.CompanyDelete,
		Permission.DriverRead,
		Permission.DriverCreate,
		Permission.DriverUpdate,
		Permission.DriverDelete,
		Permission.StatisticsRead,
	],
	User: [Permission.WaybillRead, Permission.InvoiceRead, Permission.CompanyRead, Permission.DriverRead],
};

export interface PermissionContextType {
	hasPermission: (permission: Permission) => boolean;
	hasAnyPermission: (permissions: Permission[]) => boolean;
	hasAllPermissions: (permissions: Permission[]) => boolean;
	isAdmin: () => boolean;
	isManager: () => boolean;
	isAccountant: () => boolean;
	canEdit: () => boolean;
	canDelete: () => boolean;
	canManageUsers: () => boolean;
	userPermissions: Permission[];
}
