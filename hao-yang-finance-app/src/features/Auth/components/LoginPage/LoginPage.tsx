import { useEffect, useState } from 'react';

import { Business, Login as LoginIcon, PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import {
	Alert,
	Backdrop,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import type { LoginRequest } from '../../types/auth.type';

interface LocationState {
	from?: {
		pathname: string;
	};
}

export function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { login, register, isLoading, error, clearError, isAuthenticated } = useAuth();

	const [showPassword, setShowPassword] = useState(false);
	const [isRegisterMode, setIsRegisterMode] = useState(false);

	// Get redirect path from location state
	const from = (location.state as LocationState)?.from?.pathname || '/';

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			navigate(from, { replace: true });
		}
	}, [isAuthenticated, navigate, from]);

	// Login form
	const loginForm = useForm<LoginRequest>({
		defaultValues: {
			username: '',
			password: '',
		},
	});

	// Register form
	const registerForm = useForm<{
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
		fullName: string;
	}>({
		defaultValues: {
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
			fullName: '',
		},
	});

	// Handle login
	const handleLogin = async (data: LoginRequest) => {
		clearError();
		const success = await login(data);
		if (success) {
			navigate(from, { replace: true });
		}
	};

	// Handle register
	const handleRegister = async (data: {
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
		fullName: string;
	}) => {
		if (data.password !== data.confirmPassword) {
			registerForm.setError('confirmPassword', {
				type: 'manual',
				message: '密碼與確認密碼不匹配',
			});
			return;
		}

		clearError();
		const success = await register({
			username: data.username,
			email: data.email,
			password: data.password,
			fullName: data.fullName || undefined,
		});

		if (success) {
			navigate(from, { replace: true });
		}
	};

	// Toggle password visibility
	const handleTogglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	// Switch between login and register
	const handleModeSwitch = () => {
		setIsRegisterMode(!isRegisterMode);
		clearError();
		loginForm.reset();
		registerForm.reset();
	};

	return (
		<>
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: 'grey.50',
					px: 2,
				}}
			>
				<Card
					sx={{
						maxWidth: 400,
						width: '100%',
						boxShadow: 3,
					}}
				>
					<CardContent sx={{ p: 4 }}>
						{/* Logo and Title */}
						<Box sx={{ textAlign: 'center', mb: 4 }}>
							<Business sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
							<Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
								皓揚財務追蹤系統
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{isRegisterMode ? '建立新帳戶' : '登入您的帳戶'}
							</Typography>
						</Box>

						{/* Error Alert */}
						{error && (
							<Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
								{error}
							</Alert>
						)}

						{/* Login Form */}
						{!isRegisterMode && (
							<form onSubmit={loginForm.handleSubmit(handleLogin)}>
								<Stack spacing={3}>
									<Controller
										name="username"
										control={loginForm.control}
										rules={{
											required: '請輸入用戶名',
											minLength: {
												value: 3,
												message: '用戶名至少需要3個字符',
											},
										}}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="用戶名"
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
											/>
										)}
									/>

									<Controller
										name="password"
										control={loginForm.control}
										rules={{
											required: '請輸入密碼',
											minLength: {
												value: 6,
												message: '密碼至少需要6個字符',
											},
										}}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="密碼"
												type={showPassword ? 'text' : 'password'}
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																onClick={handleTogglePasswordVisibility}
																edge="end"
																disabled={isLoading}
															>
																{showPassword ? <VisibilityOff /> : <Visibility />}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>
										)}
									/>

									<Button
										type="submit"
										variant="contained"
										size="large"
										fullWidth
										disabled={isLoading}
										startIcon={<LoginIcon />}
										sx={{ py: 1.5 }}
									>
										{isLoading ? '登入中...' : '登入'}
									</Button>
								</Stack>
							</form>
						)}

						{/* Register Form */}
						{/* {isRegisterMode && (
							<form onSubmit={registerForm.handleSubmit(handleRegister)}>
								<Stack spacing={3}>
									<Controller
										name="fullName"
										control={registerForm.control}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="姓名"
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
											/>
										)}
									/>

									<Controller
										name="username"
										control={registerForm.control}
										rules={{
											required: '請輸入用戶名',
											minLength: {
												value: 3,
												message: '用戶名至少需要3個字符',
											},
											pattern: {
												value: /^[a-zA-Z0-9_]+$/,
												message: '用戶名只能包含字母、數字和下劃線',
											},
										}}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="用戶名"
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
											/>
										)}
									/>

									<Controller
										name="email"
										control={registerForm.control}
										rules={{
											required: '請輸入電子郵件',
											pattern: {
												value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
												message: '請輸入有效的電子郵件地址',
											},
										}}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="電子郵件"
												type="email"
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
											/>
										)}
									/>

									<Controller
										name="password"
										control={registerForm.control}
										rules={{
											required: '請輸入密碼',
											minLength: {
												value: 6,
												message: '密碼至少需要6個字符',
											},
										}}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="密碼"
												type={showPassword ? 'text' : 'password'}
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																onClick={handleTogglePasswordVisibility}
																edge="end"
																disabled={isLoading}
															>
																{showPassword ? <VisibilityOff /> : <Visibility />}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>
										)}
									/>

									<Controller
										name="confirmPassword"
										control={registerForm.control}
										rules={{
											required: '請確認密碼',
										}}
										render={({ field, fieldState: { error } }) => (
											<TextField
												{...field}
												label="確認密碼"
												type={showPassword ? 'text' : 'password'}
												variant="outlined"
												fullWidth
												error={!!error}
												helperText={error?.message}
												disabled={isLoading}
											/>
										)}
									/>

									<Button
										type="submit"
										variant="contained"
										size="large"
										fullWidth
										disabled={isLoading}
										startIcon={<PersonAdd />}
										sx={{ py: 1.5 }}
									>
										{isLoading ? '註冊中...' : '註冊'}
									</Button>
								</Stack>
							</form>
						)} */}

						{/* Mode Switch */}
						<Box sx={{ mt: 3 }}>
							<Divider sx={{ mb: 1 }} />
							<Box sx={{ textAlign: 'center' }}>
								<Typography variant="body2" color="text.secondary">
									{isRegisterMode ? '已經有帳戶了？' : '還沒有帳戶？'}{' '}
									<Button
										variant="text"
										onClick={handleModeSwitch}
										disabled={isLoading}
										sx={{ fontWeight: 600 }}
									>
										{isRegisterMode ? '登入' : '註冊'}
									</Button>
								</Typography>
							</Box>
						</Box>
					</CardContent>
				</Card>
			</Box>

			{/* Loading Backdrop */}
			<Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
				<CircularProgress color="inherit" />
			</Backdrop>
		</>
	);
}
