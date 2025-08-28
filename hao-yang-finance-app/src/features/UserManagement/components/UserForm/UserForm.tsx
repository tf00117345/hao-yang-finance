import { useEffect } from 'react';

import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Switch,
	TextField,
	Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

import { useSnackbar } from '../../../../contexts/SnackbarContext';
import { UserRole } from '../../../../types/permission.types';
import { CreateUserRequest, UpdateUserRequest, UserListItem } from '../../../../types/user-management.types';
import { getRoleDescription } from '../../../../utils/permissionUtils';
import { useCreateUser, useUpdateUser } from '../../api/mutation';

interface UserFormProps {
	open: boolean;
	user?: UserListItem | null;
	onClose: () => void;
	onSuccess: () => void;
}

// Validation rules
const validationRules = {
	username: {
		required: '用戶名不能為空',
		minLength: { value: 3, message: '用戶名至少需要3個字元' },
		maxLength: { value: 50, message: '用戶名不能超過50個字元' },
	},
	email: {
		required: '電子郵件不能為空',
		pattern: {
			value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
			message: '請輸入有效的電子郵件地址',
		},
	},
	password: {
		required: '密碼不能為空',
		minLength: { value: 6, message: '密碼至少需要6個字元' },
		maxLength: { value: 100, message: '密碼不能超過100個字元' },
	},
	fullName: {
		maxLength: { value: 100, message: '全名不能超過100個字元' },
	},
	role: {
		required: '角色不能為空',
		validate: (value: string) => ['Admin', 'Manager', 'Accountant', 'User'].includes(value) || '請選擇有效的角色',
	},
};

type FormData = {
	username: string;
	email: string;
	password?: string;
	fullName: string;
	role: UserRole;
	isActive: boolean;
};

function UserForm({ open, user, onClose, onSuccess }: UserFormProps) {
	const { showSnackbar } = useSnackbar();
	const isEdit = Boolean(user);

	const createUserMutation = useCreateUser();
	const updateUserMutation = useUpdateUser();

	// Get validation rules based on edit mode
	const getValidationRules = () => ({
		username: isEdit
			? {
					minLength: { value: 3, message: '用戶名至少需要3個字元' },
					maxLength: { value: 50, message: '用戶名不能超過50個字元' },
				}
			: validationRules.username,
		email: isEdit
			? {
					pattern: {
						value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
						message: '請輸入有效的電子郵件地址',
					},
				}
			: validationRules.email,
		password: validationRules.password, // Only used in create mode
		fullName: validationRules.fullName,
		role: isEdit
			? {
					validate: (value: string) =>
						['Admin', 'Manager', 'Accountant', 'User'].includes(value) || '請選擇有效的角色',
				}
			: validationRules.role,
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<FormData>({
		mode: 'onChange',
		defaultValues: {
			username: '',
			email: '',
			password: '',
			fullName: '',
			role: 'User',
			isActive: true,
		},
	});

	// Update form when user prop changes
	useEffect(() => {
		if (open) {
			if (user) {
				reset({
					username: user.username,
					email: user.email,
					fullName: user.fullName || '',
					role: user.role,
					isActive: user.isActive,
				});
			} else {
				reset({
					username: '',
					email: '',
					password: '',
					fullName: '',
					role: 'User',
					isActive: true,
				});
			}
		}
	}, [open, user, reset]);

	const onSubmit = async (data: FormData) => {
		try {
			if (isEdit && user) {
				const updateData: UpdateUserRequest = {
					username: data.username !== user.username ? data.username : undefined,
					email: data.email !== user.email ? data.email : undefined,
					fullName: data.fullName !== (user.fullName || '') ? data.fullName : undefined,
					role: data.role !== user.role ? data.role : undefined,
					isActive: data.isActive !== user.isActive ? data.isActive : undefined,
				};

				// Only send fields that have changed
				const hasChanges = Object.values(updateData).some((value) => value !== undefined);
				if (!hasChanges) {
					showSnackbar('沒有資料需要更新', 'info');
					return;
				}

				await updateUserMutation.mutateAsync({ id: user.id, data: updateData });
				showSnackbar('使用者更新成功', 'success');
			} else {
				const createData: CreateUserRequest = {
					username: data.username,
					email: data.email,
					password: data.password!,
					fullName: data.fullName || undefined,
					role: data.role,
					isActive: data.isActive,
				};

				await createUserMutation.mutateAsync(createData);
				showSnackbar('使用者建立成功', 'success');
			}

			onSuccess();
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message || (isEdit ? '更新使用者時發生錯誤' : '建立使用者時發生錯誤');
			showSnackbar(errorMessage, 'error');
		}
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

	const roleOptions: { value: UserRole; label: string }[] = [
		{ value: 'User', label: getRoleDescription('User') },
		{ value: 'Accountant', label: getRoleDescription('Accountant') },
		{ value: 'Manager', label: getRoleDescription('Manager') },
		{ value: 'Admin', label: getRoleDescription('Admin') },
	];

	const currentValidationRules = getValidationRules();

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>{isEdit ? `編輯使用者 - ${user?.username}` : '新增使用者'}</DialogTitle>

			<form onSubmit={handleSubmit(onSubmit)}>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
						{/* Username */}
						<Controller
							name="username"
							control={control}
							rules={currentValidationRules.username}
							render={({ field }) => (
								<TextField
									{...field}
									label="用戶名"
									fullWidth
									error={!!errors.username}
									helperText={errors.username?.message}
									disabled={isLoading}
								/>
							)}
						/>

						{/* Email */}
						<Controller
							name="email"
							control={control}
							rules={currentValidationRules.email}
							render={({ field }) => (
								<TextField
									{...field}
									label="電子郵件"
									type="email"
									fullWidth
									error={!!errors.email}
									helperText={errors.email?.message}
									disabled={isLoading}
								/>
							)}
						/>

						{/* Password (only for create) */}
						{!isEdit && (
							<Controller
								name="password"
								control={control}
								rules={currentValidationRules.password}
								render={({ field }) => (
									<TextField
										{...field}
										label="密碼"
										type="password"
										fullWidth
										error={!!errors.password}
										helperText={errors.password?.message}
										disabled={isLoading}
									/>
								)}
							/>
						)}

						{/* Full Name */}
						<Controller
							name="fullName"
							control={control}
							rules={currentValidationRules.fullName}
							render={({ field }) => (
								<TextField
									{...field}
									label="全名"
									fullWidth
									error={!!errors.fullName}
									helperText={errors.fullName?.message}
									disabled={isLoading}
								/>
							)}
						/>

						{/* Role */}
						<Controller
							name="role"
							control={control}
							rules={currentValidationRules.role}
							render={({ field }) => (
								<FormControl fullWidth error={!!errors.role}>
									<InputLabel>角色</InputLabel>
									<Select {...field} label="角色" disabled={isLoading}>
										{roleOptions.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												{option.label}
											</MenuItem>
										))}
									</Select>
									{errors.role && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
											{errors.role.message}
										</Typography>
									)}
								</FormControl>
							)}
						/>

						{/* Is Active */}
						<Controller
							name="isActive"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Switch
											checked={field.value}
											onChange={(e) => field.onChange(e.target.checked)}
											disabled={isLoading}
										/>
									}
									label="啟用使用者"
								/>
							)}
						/>

						{isEdit && <Alert severity="info">如需重置密碼，請使用使用者列表中的重置密碼功能。</Alert>}
					</Box>
				</DialogContent>

				<DialogActions>
					<Button onClick={handleClose} disabled={isLoading}>
						取消
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={isLoading || !isValid}
						startIcon={isLoading ? <CircularProgress size={16} /> : null}
					>
						{isLoading ? '處理中...' : isEdit ? '更新' : '建立'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default UserForm;
