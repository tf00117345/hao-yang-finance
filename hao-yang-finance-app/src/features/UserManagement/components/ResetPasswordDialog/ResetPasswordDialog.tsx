import { useState } from 'react';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Stack,
	Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { useSnackbar } from '../../../../contexts/SnackbarContext';
import { UserListItem } from '../../../../types/user-management.types';
import { useResetUserPassword } from '../../api/mutation';

interface ResetPasswordDialogProps {
	open: boolean;
	user: UserListItem | null;
	onClose: () => void;
}

export default function ResetPasswordDialog({ open, user, onClose }: ResetPasswordDialogProps) {
	const { showSnackbar } = useSnackbar();
	const resetPasswordMutation = useResetUserPassword();

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	const handleClose = () => {
		setNewPassword('');
		setConfirmPassword('');
		setErrors({});
		setShowPassword(false);
		setShowConfirmPassword(false);
		onClose();
	};

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};

		if (!newPassword) {
			newErrors.newPassword = '請輸入新密碼';
		} else if (newPassword.length < 6) {
			newErrors.newPassword = '密碼長度至少需要 6 個字符';
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = '請確認新密碼';
		} else if (newPassword !== confirmPassword) {
			newErrors.confirmPassword = '兩次輸入的密碼不一致';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!user || !validateForm()) return;

		try {
			await resetPasswordMutation.mutateAsync({
				id: user.id,
				data: { newPassword },
			});
			showSnackbar(`已成功重設 ${user.username} 的密碼`, 'success');
			handleClose();
		} catch (error: any) {
			showSnackbar(error.response?.data?.message || '重設密碼時發生錯誤', 'error');
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>重設使用者密碼</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 1 }}>
					<Typography variant="body2" color="text.secondary">
						正在為使用者 <strong>{user?.username}</strong> 重設密碼
					</Typography>

					<FormControl variant="outlined" error={!!errors.newPassword}>
						<InputLabel htmlFor="new-password">新密碼</InputLabel>
						<OutlinedInput
							id="new-password"
							type={showPassword ? 'text' : 'password'}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							endAdornment={
								<InputAdornment position="end">
									<IconButton
										aria-label="toggle password visibility"
										onClick={() => setShowPassword(!showPassword)}
										edge="end"
									>
										{showPassword ? <VisibilityOff /> : <Visibility />}
									</IconButton>
								</InputAdornment>
							}
							label="新密碼"
						/>
						{errors.newPassword && <FormHelperText>{errors.newPassword}</FormHelperText>}
					</FormControl>

					<FormControl variant="outlined" error={!!errors.confirmPassword}>
						<InputLabel htmlFor="confirm-password">確認新密碼</InputLabel>
						<OutlinedInput
							id="confirm-password"
							type={showConfirmPassword ? 'text' : 'password'}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							endAdornment={
								<InputAdornment position="end">
									<IconButton
										aria-label="toggle password visibility"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										edge="end"
									>
										{showConfirmPassword ? <VisibilityOff /> : <Visibility />}
									</IconButton>
								</InputAdornment>
							}
							label="確認新密碼"
						/>
						{errors.confirmPassword && <FormHelperText>{errors.confirmPassword}</FormHelperText>}
					</FormControl>

					<Typography variant="caption" color="text.secondary">
						密碼長度至少需要 6 個字符
					</Typography>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={resetPasswordMutation.isPending}>
					取消
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={resetPasswordMutation.isPending}
				>
					{resetPasswordMutation.isPending ? '重設中...' : '確認重設'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}