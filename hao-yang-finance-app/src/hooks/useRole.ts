import { useQuery } from '@tanstack/react-query';

import { roleApi } from '../api/role.api';

export const ROLE_QUERY_KEYS = {
	allPermissions: ['roles', 'permissions', 'all'] as const,
	rolePermissions: (role: string) => ['roles', 'permissions', role] as const,
	allRolesPermissions: ['roles', 'all'] as const,
	myPermissions: ['roles', 'my-permissions'] as const,
	checkPermission: (permission: string) => ['roles', 'check-permission', permission] as const,
};

// 獲取所有權限列表
export const useAllPermissions = () => {
	return useQuery({
		queryKey: ROLE_QUERY_KEYS.allPermissions,
		queryFn: roleApi.getAllPermissions,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
};

// 獲取指定角色的權限
export const useRolePermissions = (role: string) => {
	return useQuery({
		queryKey: ROLE_QUERY_KEYS.rolePermissions(role),
		queryFn: () => roleApi.getRolePermissions(role),
		enabled: !!role,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
};

// 獲取所有角色及其權限
export const useAllRolesPermissions = () => {
	return useQuery({
		queryKey: ROLE_QUERY_KEYS.allRolesPermissions,
		queryFn: roleApi.getAllRolesPermissions,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
};

// 獲取當前使用者的權限
export const useMyPermissions = () => {
	return useQuery({
		queryKey: ROLE_QUERY_KEYS.myPermissions,
		queryFn: roleApi.getMyPermissions,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};

// 檢查當前使用者是否擁有指定權限
export const useCheckPermission = (permissionName: string) => {
	return useQuery({
		queryKey: ROLE_QUERY_KEYS.checkPermission(permissionName),
		queryFn: () => roleApi.checkPermission(permissionName),
		enabled: !!permissionName,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
