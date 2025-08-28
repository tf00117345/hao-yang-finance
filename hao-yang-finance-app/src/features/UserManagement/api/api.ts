import {
	ChangeUserRoleRequest,
	ChangeUserStatusRequest,
	CreateUserRequest,
	ResetUserPasswordRequest,
	UpdateUserRequest,
	UserDetail,
	UserListResponse,
	UserSearchParams,
} from '../../../types/user-management.types';
import { axiosInstance } from '../../../utils/axios-instance';

// Get users list with optional filters
export const getUsers = async (params?: UserSearchParams): Promise<UserListResponse> => {
	const response = await axiosInstance.get('/user', { params });
	return response.data;
};

// Get user by ID
export const getUser = async (id: string): Promise<UserDetail> => {
	const response = await axiosInstance.get(`/user/${id}`);
	return response.data;
};

// Create new user
export const createUser = async (data: CreateUserRequest): Promise<UserDetail> => {
	const response = await axiosInstance.post('/user', data);
	return response.data;
};

// Update user
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<UserDetail> => {
	const response = await axiosInstance.put(`/user/${id}`, data);
	return response.data;
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
	await axiosInstance.delete(`/user/${id}`);
};

// Change user role
export const changeUserRole = async (id: string, data: ChangeUserRoleRequest): Promise<void> => {
	await axiosInstance.put(`/user/${id}/role`, data);
};

// Change user status (activate/deactivate)
export const changeUserStatus = async (id: string, data: ChangeUserStatusRequest): Promise<void> => {
	await axiosInstance.put(`/user/${id}/status`, data);
};

// Reset user password
export const resetUserPassword = async (id: string, data: ResetUserPasswordRequest): Promise<void> => {
	await axiosInstance.post(`/user/${id}/reset-password`, data);
};

// Get current user's permissions
export const getMyPermissions = async (): Promise<string[]> => {
	const response = await axiosInstance.get(`/user/my-permissions`);
	return response.data;
};
