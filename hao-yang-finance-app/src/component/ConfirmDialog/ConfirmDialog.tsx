import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import React from 'react';

/**
 * 通用確認對話框元件
 * - 用於在執行破壞性或需要確認的操作前，提示使用者確認
 */
export interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description?: string | React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	confirmColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
	isConfirming?: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

function ConfirmDialog({
	open,
	title,
	description,
	confirmText = '確認',
	cancelText = '取消',
	confirmColor = 'primary',
	isConfirming = false,
	onClose,
	onConfirm,
}: ConfirmDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle>{title}</DialogTitle>
			{description && (
				<DialogContent>
					{typeof description === 'string' ? (
						<Typography variant="body2">{description}</Typography>
					) : (
						description
					)}
				</DialogContent>
			)}
			<DialogActions>
				<Button onClick={onClose} disabled={isConfirming}>
					{cancelText}
				</Button>
				<Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ConfirmDialog;
