import { axiosInstance } from '../../../utils/axios-instance';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  TokenResponse,
  ChangePasswordRequest,
  User
} from '../types/auth.type';

// 用戶登入
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

// 用戶註冊
export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

// 刷新訪問令牌
export const refreshToken = async (data: RefreshTokenRequest): Promise<TokenResponse> => {
  const response = await axiosInstance.post('/auth/refresh-token', data);
  return response.data;
};

// 用戶登出
export const logout = async (refreshToken: string): Promise<void> => {
  await axiosInstance.post('/auth/logout', { refreshToken });
};

// 獲取當前用戶資料
export const getProfile = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/profile');
  return response.data;
};

// 修改密碼
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await axiosInstance.post('/auth/change-password', data);
};

// 驗證令牌有效性
export const verifyToken = async (): Promise<{
  message: string;
  userId: string;
  username: string;
  role: string;
  isAuthenticated: boolean;
}> => {
  const response = await axiosInstance.get('/auth/verify-token');
  return response.data;
};