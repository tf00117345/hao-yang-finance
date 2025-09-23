export interface PermissionDto {
	name: string;
	displayName: string;
	category: string;
}

export interface RolePermissionsDto {
	roleName: string;
	displayName: string;
	permissions: PermissionDto[];
}

export interface AllRolesPermissionsDto {
	roles: RolePermissionsDto[];
	allPermissions: PermissionDto[];
}

export interface UserPermissionsDto {
	userId: string;
	role: string;
	permissions: PermissionDto[];
}
