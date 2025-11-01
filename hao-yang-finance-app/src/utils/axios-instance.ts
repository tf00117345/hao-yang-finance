import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Local storage keys
const STORAGE_KEYS = {
	ACCESS_TOKEN: 'auth_access_token',
	REFRESH_TOKEN: 'auth_refresh_token',
	USER: 'auth_user',
} as const;

// Get API URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7034';

export const axiosInstance: AxiosInstance = axios.create({
	baseURL: `${API_BASE_URL}/api`,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Helper functions
const getStoredToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
const getStoredRefreshToken = () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
const removeStoredTokens = () => {
	localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
	localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
	localStorage.removeItem(STORAGE_KEYS.USER);
};

// Request interceptor - Add authorization header
axiosInstance.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getStoredToken();
		if (token) {
			const updatedConfig: InternalAxiosRequestConfig = {
				...config,
				headers: {
					...(config.headers || {}),
					Authorization: `Bearer ${token}`,
				},
			} as InternalAxiosRequestConfig;

			return updatedConfig;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error: AxiosError) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & { retry?: boolean };

		// Check if error is 401 and we haven't already tried to refresh
		if (error.response?.status === 401 && !originalRequest.retry) {
			originalRequest.retry = true;

			const refreshToken = getStoredRefreshToken();

			// If no refresh token, redirect to login
			if (!refreshToken) {
				removeStoredTokens();
				// Dispatch custom event to notify auth context
				window.dispatchEvent(new CustomEvent('auth:logout'));
				return Promise.reject(error);
			}

			// Prevent multiple concurrent refresh requests
			if (!isRefreshing) {
				isRefreshing = true;

				refreshPromise = new Promise((resolve, reject) => {
					axios
						.post(
							`${axiosInstance.defaults.baseURL}/auth/refresh-token`,
							{ refreshToken },
							{
								headers: {
									'Content-Type': 'application/json',
								},
							},
						)
						.then((response) => {
							const { accessToken, refreshToken: newRefreshToken } = response.data as any;
							localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
							localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
							window.dispatchEvent(
								new CustomEvent('auth:token-refreshed', {
									detail: { accessToken, refreshToken: newRefreshToken },
								}),
							);
							resolve(accessToken);
						})
						.catch((refreshError) => {
							removeStoredTokens();
							window.dispatchEvent(new CustomEvent('auth:logout'));
							reject(refreshError);
						})
						.finally(() => {
							isRefreshing = false;
							refreshPromise = null;
						});
				});
			}

			try {
				const newToken = await refreshPromise;

				// Retry original request with new token
				const retriedRequest: InternalAxiosRequestConfig = {
					...originalRequest,
					headers: {
						...(originalRequest.headers || {}),
						Authorization: `Bearer ${newToken}`,
					},
				} as InternalAxiosRequestConfig;

				return await axiosInstance(retriedRequest);
			} catch (refreshError) {
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);
