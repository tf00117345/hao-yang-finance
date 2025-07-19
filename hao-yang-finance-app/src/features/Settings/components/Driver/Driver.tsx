import { useCallback, useMemo, useRef, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	TextField,
} from '@mui/material';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { useForm } from 'react-hook-form';

import AgGridTable from '../../../../component/AgGridTable/AgGridTable';
import { useDeleteDriverMutation, useInsertDriverMutation, useUpdateDriverMutation } from '../../api/mutation';
import { useDriversQuery } from '../../api/query';
import { CreateDriverDto, Driver as DriverData } from '../../types/driver';

// 初始表單數據
const initialFormData: CreateDriverDto = {
	name: '',
};

export function Driver() {
	// 狀態管理
	const [open, setOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const gridApi = useRef<GridApi<DriverData>>();

	// React Hook Form 設置
	const { control, register, handleSubmit, reset } = useForm<DriverData>({
		defaultValues: initialFormData,
	});

	// 查詢和變更操作
	const { data: drivers = [], isPending: isQueryPending } = useDriversQuery();
	const { mutate: deleteDriver, isPending: isDeletePending } = useDeleteDriverMutation();
	const { mutate: insertDriver, isPending: isInsertPending } = useInsertDriverMutation();
	const { mutate: updateDriver, isPending: isUpdatePending } = useUpdateDriverMutation();

	// AG-Grid 列定義
	const columnDefs = useMemo<ColDef[]>(
		() => [
			{
				field: 'id',
				headerName: 'ID',
				flex: 1,
				hide: true,
			},
			{
				field: 'name',
				headerName: '駕駛姓名',
				flex: 1,
				sortable: true,
				filter: true,
			},
			{
				headerName: '操作',
				width: 120,
				sortable: false,
				filter: false,
				cellRenderer: (params: any) => {
					return (
						<Box>
							<IconButton onClick={() => handleEdit(params.data)} size="small">
								<EditIcon />
							</IconButton>
							<IconButton onClick={() => handleDelete(params.data.id)} size="small">
								<DeleteIcon />
							</IconButton>
						</Box>
					);
				},
			},
		],
		[],
	);

	// AG-Grid 預設列配置
	const defaultColDef = useMemo(
		() => ({
			resizable: true,
		}),
		[],
	);

	// 處理 Grid Ready 事件
	const onGridReady = useCallback((params: GridReadyEvent) => {
		gridApi.current = params.api;
	}, []);

	// 處理對話框開關
	const handleOpen = () => setOpen(true);
	const handleClose = () => {
		setOpen(false);
		reset(initialFormData);
		setIsEditing(false);
	};

	// 處理表單提交
	const onSubmit = (data: DriverData) => {
		if (isEditing) {
			updateDriver({ id: data.id, driver: { name: data.name, isActive: data.isActive, phone: data.phone } });
		} else {
			insertDriver(data);
		}
		handleClose();
	};

	// 處理編輯
	const handleEdit = (driver: DriverData) => {
		reset(driver);
		setIsEditing(true);
		handleOpen();
	};

	// 處理刪除
	const handleDelete = (id: string) => {
		if (window.confirm('確定要刪除這位駕駛嗎？')) {
			deleteDriver(id);
		}
	};

	return (
		<>
			<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
				<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
					新增駕駛
				</Button>
			</Box>

			<Stack sx={{ flex: 1, width: '100%', height: '100%' }} spacing={1}>
				<AgGridTable<DriverData>
					rowData={drivers}
					colDefs={columnDefs}
					defaultColDef={defaultColDef}
					onGridReady={onGridReady}
					loading={isQueryPending || isDeletePending || isInsertPending || isUpdatePending}
					rowSelection={{
						mode: 'singleRow',
						checkboxes: false,
						enableClickSelection: true,
					}}
				/>
			</Stack>

			{/* 新增/編輯對話框 */}
			<Dialog open={open} onClose={handleClose} sx={{ '& .MuiDialog-paper': { width: '65%' } }}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogTitle>{isEditing ? '編輯駕駛資料' : '新增駕駛'}</DialogTitle>
					<DialogContent>
						<Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
							<TextField fullWidth label="駕駛姓名" {...register('name')} />
						</Box>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleClose}>取消</Button>
						<Button type="submit" variant="contained">
							{isEditing ? '更新' : '新增'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</>
	);
}
