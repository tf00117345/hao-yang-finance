import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Local storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

export const axiosInstance: AxiosInstance = axios.create({
	baseURL: 'https://localhost:7034/api',
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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
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
        
        refreshPromise = new Promise(async (resolve, reject) => {
          try {
            const response = await axios.post(
              `${axiosInstance.defaults.baseURL}/auth/refresh-token`,
              { refreshToken },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            // Update stored tokens
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            
            // Dispatch custom event to notify auth context
            window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
              detail: { accessToken, refreshToken: newRefreshToken }
            }));
            
            resolve(accessToken);
          } catch (refreshError) {
            // Refresh failed, logout user
            removeStoredTokens();
            window.dispatchEvent(new CustomEvent('auth:logout'));
            reject(refreshError);
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        });
      }
      
      try {
        const newToken = await refreshPromise;
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
