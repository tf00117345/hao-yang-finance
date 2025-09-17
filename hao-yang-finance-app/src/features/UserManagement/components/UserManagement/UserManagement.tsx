import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
} from '@mui/material';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import PermissionGuard from '../../../../components/PermissionGuard/PermissionGuard';
import { usePermission } from '../../../../contexts/PermissionContext';
import { useSnackbar } from '../../../../contexts/SnackbarContext';
import { Permission } from '../../../../types/permission.types';
import { UserListItem } from '../../../../types/user-management.types';
import { useChangeUserStatus, useDeleteUser } from '../../api/mutation';
import { useUsers } from '../../api/query';
import ResetPasswordDialog from '../ResetPasswordDialog/ResetPasswordDialog';
import UserForm from '../UserForm/UserForm';
import UserRoleCell from '../UserGrid/Cells/UserRoleCell';
import UserRowActionCell from '../UserGrid/Cells/UserRowActionCell';
import UserStatusCell from '../UserGrid/Cells/UserStatusCell';

function UserManagement() {
	const { showSnackbar } = useSnackbar();
	const { isAdmin } = usePermission();

	const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

	// API hooks
	const { data: usersData, isLoading, error, refetch } = useUsers();
	const deleteUserMutation = useDeleteUser();
	const changeUserStatusMutation = useChangeUserStatus();

	const handleCreateUser = () => {
		setSelectedUser(null);
		setIsFormOpen(true);
	};

	const handleEditUser = (user: UserListItem) => {
		setSelectedUser(user);
		setIsFormOpen(true);
	};

	const handleDeleteUser = (user: UserListItem) => {
		setSelectedUser(user);
		setIsDeleteDialogOpen(true);
	};

	const handleResetPassword = (user: UserListItem) => {
		setSelectedUser(user);
		setIsResetPasswordDialogOpen(true);
	};

	const confirmDeleteUser = async () => {
		if (!selectedUser) return;

		try {
			await deleteUserMutation.mutateAsync(selectedUser.id);
			showSnackbar('使用者刪除成功', 'success');
			setIsDeleteDialogOpen(false);
			setSelectedUser(null);
		} catch (error: any) {
			showSnackbar(error.response?.data?.message || '刪除使用者時發生錯誤', 'error');
		}
	};

	const handleToggleUserStatus = async (user: UserListItem) => {
		try {
			await changeUserStatusMutation.mutateAsync({
				id: user.id,
				data: { isActive: !user.isActive },
			});
			showSnackbar(`使用者已${user.isActive ? '停用' : '啟用'}`, 'success');
		} catch (error: any) {
			showSnackbar(error.response?.data?.message || '變更使用者狀態時發生錯誤', 'error');
		}
	};

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return '從未';
		return new Date(dateString).toLocaleString('zh-TW');
	};

	// AG Grid column definitions
	const columnDefs: ColDef<UserListItem>[] = [
		{
			headerName: '用戶名',
			field: 'username',
			sortable: true,
			filter: true,
			width: 150,
		},
		{
			headerName: '電子郵件',
			field: 'email',
			sortable: true,
			filter: true,
			width: 200,
		},
		{
			headerName: '全名',
			field: 'fullName',
			sortable: true,
			filter: true,
			width: 150,
			valueGetter: (params) => params.data?.fullName || '未設定',
		},
		{
			headerName: '角色',
			field: 'role',
			sortable: true,
			filter: true,
			width: 120,
			cellRenderer: 'userRoleCell',
		},
		{
			headerName: '狀態',
			field: 'isActive',
			sortable: true,
			filter: true,
			width: 100,
			cellRenderer: 'userStatusCell',
		},
		{
			headerName: '最後登入',
			field: 'lastLoginAt',
			sortable: true,
			width: 180,
			valueGetter: (params) => formatDate(params.data?.lastLoginAt),
		},
		{
			headerName: '建立時間',
			field: 'createdAt',
			sortable: true,
			width: 180,
			valueGetter: (params) => formatDate(params.data?.createdAt),
		},
		{
			headerName: '操作',
			width: 200,
			pinned: 'right',
			cellRenderer: 'userRowActionCell',
		},
	];

	// 權限檢查 - 只有 Admin 可以管理使用者
	if (!isAdmin()) {
		return (
			<Alert sx={{ width: '100%' }} severity="error">
				您沒有權限訪問使用者管理功能。請聯繫系統管理員。
			</Alert>
		);
	}

	if (error) {
		return (
			<Alert sx={{ width: '100%' }} severity="error">
				載入使用者列表時發生錯誤: {(error as any)?.message}
			</Alert>
		);
	}

	return (
		<Stack spacing={1} sx={{ height: '100%', width: '100%' }}>
			{/* Header */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="h5">使用者管理</Typography>
				<PermissionGuard permission={Permission.UserCreate} hideWhenNoPermission>
					<Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateUser}>
						新增使用者
					</Button>
				</PermissionGuard>
			</Box>

			{/* Users Grid */}
			<Box sx={{ flex: 1, width: '100%' }}>
				<AgGridReact
					rowData={usersData?.users || []}
					columnDefs={columnDefs}
					loading={isLoading}
					domLayout="normal"
					defaultColDef={{
						resizable: true,
						sortable: true,
						filter: true,
					}}
					rowHeight={50}
					components={{
						userRowActionCell: UserRowActionCell,
						userRoleCell: UserRoleCell,
						userStatusCell: UserStatusCell,
					}}
					context={{
						handleEditUser,
						handleDeleteUser,
						handleToggleUserStatus,
						handleResetPassword,
					}}
				/>
			</Box>

			{/* User Form Dialog */}
			<UserForm
				open={isFormOpen}
				user={selectedUser}
				onClose={() => {
					setIsFormOpen(false);
					setSelectedUser(null);
				}}
				onSuccess={() => {
					setIsFormOpen(false);
					setSelectedUser(null);
					refetch();
				}}
			/>

			{/* Reset Password Dialog */}
			<ResetPasswordDialog
				open={isResetPasswordDialogOpen}
				user={selectedUser}
				onClose={() => {
					setIsResetPasswordDialogOpen(false);
					setSelectedUser(null);
				}}
			/>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} maxWidth="sm" fullWidth>
				<DialogTitle>確認刪除使用者</DialogTitle>
				<DialogContent>
					<Typography>
						您確定要刪除使用者 <strong>{selectedUser?.username}</strong> 嗎？
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						此操作無法復原，將永久刪除此使用者的所有資料。
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
					<Button
						onClick={confirmDeleteUser}
						color="error"
						variant="contained"
						disabled={deleteUserMutation.isPending}
					>
						{deleteUserMutation.isPending ? '刪除中...' : '確認刪除'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}

export default UserManagement;
