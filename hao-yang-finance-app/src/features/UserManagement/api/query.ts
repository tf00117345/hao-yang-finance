import { useQuery } from '@tanstack/react-query';

import { UserSearchParams } from '../../../types/user-management.types';
import { getMyPermissions, getUser, getUsers } from './api';

// Query keys
export const USER_MANAGEMENT_QUERY_KEYS = {
	users: 'users',
	user: (id: string) => ['user', id],
	myPermissions: 'myPermissions',
} as const;

// Get users with search/filter parameters
export const useUsers = (params?: UserSearchParams) => {
	return useQuery({
		queryKey: [USER_MANAGEMENT_QUERY_KEYS.users, params],
		queryFn: () => getUsers(params),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

// Get user by ID
export const useUser = (id: string, enabled = true) => {
	return useQuery({
		queryKey: USER_MANAGEMENT_QUERY_KEYS.user(id),
		queryFn: () => getUser(id),
		enabled: enabled && !!id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

// Get current user's permissions
export const useMyPermissions = () => {
	return useQuery({
		queryKey: [USER_MANAGEMENT_QUERY_KEYS.myPermissions],
		queryFn: getMyPermissions,
		staleTime: 10 * 60 * 1000, // 10 minutes
	});
};
