import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { useCallback, useMemo, useRef, useState } from 'react';
import AgGridTable from '../../../../component/AgGridTable/AgGridTable';
import {
	useCompaniesQuery,
	useDeleteCompanyMutation,
	useInsertCompanyMutation,
	useUpdateCompanyMutation,
} from '../../api/api';
import { Company as CompanyData } from '../../types/company';
import CompanyForm from '../CompanyForm/CompanyForm';

export function Company() {
	// 狀態管理
	const [open, setOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const gridApi = useRef<GridApi<CompanyData>>();

	// 編輯中的公司資料
	const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);

	// 查詢和變更操作
	const { data: companies = [], isPending: isQueryPending } = useCompaniesQuery();
	const { mutate: deleteCompany, isPending: isDeletePending } = useDeleteCompanyMutation();
	const { mutate: insertCompany, isPending: isInsertPending } = useInsertCompanyMutation();
	const { mutate: updateCompany, isPending: isUpdatePending } = useUpdateCompanyMutation();

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
				headerName: '公司名稱',
				flex: 1,
				sortable: true,
				filter: true,
			},
			{
				field: 'taxNumber',
				headerName: '統一編號',
				flex: 1,
				sortable: true,
				filter: true,
			},
			{
				field: 'address',
				headerName: '地址',
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: 'phone',
				headerName: '電話',
				flex: 1,
				sortable: true,
				filter: true,
				// 自定義渲染phone array
				cellRenderer: (params: any) => {
					return params.value?.join(', ') || '';
				},
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
		setEditingCompany(null);
		setIsEditing(false);
	};

	// 處理表單提交
	const handleSubmit = (data: CompanyData) => {
		if (isEditing) {
			updateCompany(data);
		} else {
			insertCompany(data);
		}
		handleClose();
	};

	// 處理編輯
	const handleEdit = (company: CompanyData) => {
		setEditingCompany(company);
		setIsEditing(true);
		handleOpen();
	};

	// 處理刪除
	const handleDelete = (id: string) => {
		if (window.confirm('確定要刪除這家公司嗎？')) {
			deleteCompany(id);
		}
	};

	// 新增搜尋功能
	const handleSearch = useCallback((searchText: string) => {
		if (gridApi.current) {
			gridApi.current.setGridOption('quickFilterText', searchText);
		}
	}, []);

	return (
		<>
			<Stack direction="row" spacing={2} sx={{ display: 'flex' }}>
				<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
					新增公司
				</Button>

				<TextField
					placeholder="搜尋公司..."
					size="small"
					onChange={(e) => handleSearch(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						},
					}}
					sx={{ width: '300px' }}
				/>
			</Stack>

			<Stack sx={{ flex: 1, width: '100%', height: '100%' }} spacing={1}>
				<AgGridTable<CompanyData>
					rowData={companies}
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
			<CompanyForm
				open={open}
				onClose={handleClose}
				onSubmit={handleSubmit}
				initialData={editingCompany}
				isEditing={isEditing}
			/>
		</>
	);
}
