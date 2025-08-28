import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
	ChangeUserRoleRequest,
	ChangeUserStatusRequest,
	CreateUserRequest,
	ResetUserPasswordRequest,
	UpdateUserRequest,
} from '../../../types/user-management.types';
import { changeUserRole, changeUserStatus, createUser, deleteUser, resetUserPassword, updateUser } from './api';
import { USER_MANAGEMENT_QUERY_KEYS } from './query';

// Create user mutation
export const useCreateUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateUserRequest) => createUser(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEYS.users] });
		},
	});
};

// Update user mutation
export const useUpdateUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => updateUser(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEYS.users] });
			queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.user(variables.id) });
		},
	});
};

// Delete user mutation
export const useDeleteUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteUser(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEYS.users] });
		},
	});
};

// Change user role mutation
export const useChangeUserRole = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ChangeUserRoleRequest }) => changeUserRole(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEYS.users] });
			queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.user(variables.id) });
		},
	});
};

// Change user status mutation
export const useChangeUserStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ChangeUserStatusRequest }) => changeUserStatus(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEYS.users] });
			queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.user(variables.id) });
		},
	});
};

// Reset user password mutation
export const useResetUserPassword = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ResetUserPasswordRequest }) => resetUserPassword(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: USER_MANAGEMENT_QUERY_KEYS.user(variables.id) });
		},
	});
};
