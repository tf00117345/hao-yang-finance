import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AuthState, AuthContextType, LoginRequest, RegisterRequest, ChangePasswordRequest, User } from '../types/auth.type';
import * as authApi from '../api/authApi';

// Local storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_TOKEN'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check stored auth
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_TOKEN':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for localStorage
const storeAuthData = (user: User, accessToken: string, refreshToken: string) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

const getStoredAuthData = () => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  
  if (accessToken && refreshToken && userStr) {
    try {
      const user = JSON.parse(userStr) as User;
      return { accessToken, refreshToken, user };
    } catch {
      clearAuthData();
      return null;
    }
  }
  return null;
};

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAuth = getStoredAuthData();
      
      if (storedAuth) {
        // Verify token is still valid
        try {
          await authApi.verifyToken();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: storedAuth,
          });
        } catch {
          // Token is invalid, clear stored data
          clearAuthData();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth events from axios interceptors
  useEffect(() => {
    const handleLogout = () => {
      clearAuthData();
      dispatch({ type: 'LOGOUT' });
    };

    const handleTokenRefresh = (event: CustomEvent) => {
      const { accessToken, refreshToken } = event.detail;
      dispatch({
        type: 'UPDATE_TOKEN',
        payload: { accessToken, refreshToken },
      });
    };

    window.addEventListener('auth:logout', handleLogout as EventListener);
    window.addEventListener('auth:token-refreshed', handleTokenRefresh as EventListener);

    return () => {
      window.removeEventListener('auth:logout', handleLogout as EventListener);
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh as EventListener);
    };
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await authApi.login(credentials);
      
      // Store auth data
      storeAuthData(response.user, response.accessToken, response.refreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登入失敗，請檢查您的用戶名和密碼';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (state.refreshToken) {
        await authApi.logout(state.refreshToken);
      }
    } catch {
      // Ignore logout errors, still clear local state
    } finally {
      clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  }, [state.refreshToken]);

  // Register function
  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      await authApi.register(data);
      
      // After successful registration, automatically log in
      return await login({ username: data.username, password: data.password });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '註冊失敗，請稍後再試';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return false;
    }
  }, [login]);

  // Refresh token function
  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    if (!state.refreshToken) {
      return false;
    }

    try {
      const response = await authApi.refreshToken({ refreshToken: state.refreshToken });
      
      // Update stored tokens
      const storedAuth = getStoredAuthData();
      if (storedAuth) {
        storeAuthData(storedAuth.user, response.accessToken, response.refreshToken);
      }
      
      dispatch({
        type: 'UPDATE_TOKEN',
        payload: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
      
      return true;
    } catch {
      // Refresh failed, logout user
      await logout();
      return false;
    }
  }, [state.refreshToken, logout]);

  // Change password function
  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<boolean> => {
    try {
      await authApi.changePassword(data);
      // Password change requires re-login, so logout user
      await logout();
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '密碼修改失敗';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return false;
    }
  }, [logout]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    register,
    refreshToken: refreshTokenFn,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export context for advanced usage
export { AuthContext };