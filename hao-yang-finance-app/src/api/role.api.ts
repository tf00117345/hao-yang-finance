import { AllRolesPermissionsDto, PermissionDto, RolePermissionsDto, UserPermissionsDto } from '../types/role.types';
import { axiosInstance } from '../utils/axios-instance';

export const roleApi = {
	// 獲取所有權限列表
	getAllPermissions: async (): Promise<PermissionDto[]> => {
		const response = await axiosInstance.get('/role/permissions');
		return response.data;
	},

	// 獲取指定角色的權限
	getRolePermissions: async (role: string): Promise<RolePermissionsDto> => {
		const response = await axiosInstance.get(`/role/permissions/${role}`);
		return response.data;
	},

	// 獲取所有角色及其權限
	getAllRolesPermissions: async (): Promise<AllRolesPermissionsDto> => {
		const response = await axiosInstance.get('/role/all');
		return response.data;
	},

	// 獲取當前使用者的權限
	getMyPermissions: async (): Promise<UserPermissionsDto> => {
		const response = await axiosInstance.get('/role/my-permissions');
		return response.data;
	},

	// 檢查當前使用者是否擁有指定權限
	checkPermission: async (permissionName: string): Promise<boolean> => {
		const response = await axiosInstance.post('/role/check-permission', permissionName);
		return response.data;
	},
};
