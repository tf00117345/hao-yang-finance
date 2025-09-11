import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import { Box, IconButton, Tooltip } from '@mui/material';
import type { CustomCellRendererProps } from 'ag-grid-react';

import { UserListItem } from '../../../../../types/user-management.types';

export default function UserRowActionCell(params: CustomCellRendererProps) {
	const user = params.data as UserListItem;

	const handleEditUser = (user: UserListItem) => {
		params.context.handleEditUser(user);
	};

	const handleDeleteUser = (user: UserListItem) => {
		params.context.handleDeleteUser(user);
	};

	const handleToggleUserStatus = async (user: UserListItem) => {
		params.context.handleToggleUserStatus(user);
	};

	const handleResetPassword = (user: UserListItem) => {
		params.context.handleResetPassword(user);
	};

	return (
		<Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
			<Tooltip title="編輯">
				<IconButton size="small" onClick={() => handleEditUser(user)} color="primary">
					<EditIcon fontSize="small" />
				</IconButton>
			</Tooltip>

			<Tooltip title="重設密碼">
				<IconButton size="small" onClick={() => handleResetPassword(user)} color="secondary">
					<LockResetIcon fontSize="small" />
				</IconButton>
			</Tooltip>

			<Tooltip title={user.isActive ? '停用' : '啟用'}>
				<IconButton
					size="small"
					onClick={() => handleToggleUserStatus(user)}
					color={user.isActive ? 'warning' : 'success'}
				>
					{user.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
				</IconButton>
			</Tooltip>

			<Tooltip title="刪除">
				<IconButton size="small" onClick={() => handleDeleteUser(user)} color="error">
					<DeleteIcon fontSize="small" />
				</IconButton>
			</Tooltip>
		</Box>
	);
}
