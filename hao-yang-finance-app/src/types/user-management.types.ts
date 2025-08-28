import { UserRole } from './permission.types';

export interface CreateUserRequest {
	username: string;
	email: string;
	password: string;
	fullName?: string;
	role: UserRole;
	isActive: boolean;
}

export interface UpdateUserRequest {
	username?: string;
	email?: string;
	fullName?: string;
	role?: UserRole;
	isActive?: boolean;
}

export interface ChangeUserRoleRequest {
	role: UserRole;
}

export interface ChangeUserStatusRequest {
	isActive: boolean;
}

export interface ResetUserPasswordRequest {
	newPassword: string;
}

export interface UserListItem {
	id: string;
	username: string;
	email: string;
	fullName?: string;
	role: UserRole;
	isActive: boolean;
	createdAt: string;
	lastLoginAt?: string;
}

export interface UserDetail {
	id: string;
	username: string;
	email: string;
	fullName?: string;
	role: UserRole;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lastLoginAt?: string;
	permissions?: string[];
}

export interface UserSearchParams {
	username?: string;
	email?: string;
	role?: UserRole;
	isActive?: boolean;
	pageSize?: number;
	page?: number;
}

export interface UserListResponse {
	users: UserListItem[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
