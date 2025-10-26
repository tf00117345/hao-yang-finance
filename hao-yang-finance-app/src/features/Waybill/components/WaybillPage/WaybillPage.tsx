import { useEffect, useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Drawer,
	IconButton,
	Skeleton,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import debounce from 'lodash.debounce';
import * as R from 'ramda';

import MonthPicker from '../../../../component/MonthPicker/MonthPicker';
import { useInsertCompanyMutation } from '../../../Settings/api/mutation';
import { useCompaniesQuery, useDriversQuery } from '../../../Settings/api/query';
import { Company } from '../../../Settings/types/company';
import { Driver } from '../../../Settings/types/driver';
import { useDeleteWaybillMutation, useInsertWaybillMutation, useUpdateWaybillMutation } from '../../api/mutation';
import { useWaybillsQuery } from '../../api/query';
import { Waybill, WaybillFormData } from '../../types/waybill.types';
import WaybillForm from '../WaybillForm/WaybillForm';
import { WaybillGrid } from '../WaybillGrid/WaybillGrid';

const defaultWaybill: WaybillFormData = {
	id: '',
	// waybillNumber: '',
	date: format(new Date(), 'yyyy-MM-dd'),
	item: '鑽機組',
	companyName: '',
	companyId: '',
	loadingLocations: [{ from: '空白', to: '空白' }],
	workingTime: { start: '', end: '' },
	fee: 3000,
	driverName: '黃天賜',
	driverId: '32dde0f7-9274-4813-be36-adab21c415f3',
	plateNumber: '',
	notes: '',
	extraExpenses: [],
	status: 'PENDING',
	tonnage: 10.4,
	markAsNoInvoiceNeeded: false,
};

export default function WaybillPage() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // 小於768px為手機版
	const isTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 768px-1199px為平板

	const [dateRange, setDateRange] = useState<{
		start: Date;
		end: Date;
	}>({
		start: startOfMonth(new Date()),
		end: endOfMonth(new Date()),
	});

	const [selectedWaybill, setSelectedWaybill] = useState<WaybillFormData | null>(null);
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [formDrawerOpen, setFormDrawerOpen] = useState(false);

	// 輸入框顯示的狀態（立即更新）
	const [locationSearchInput, setLocationSearchInput] = useState('');
	const [companySearchInput, setCompanySearchInput] = useState('');

	// API 查詢使用的狀態（debounced 更新）
	const [locationSearch, setLocationSearch] = useState('');
	const [companySearch, setCompanySearch] = useState('');

	const { data: waybills = [], isPending } = useWaybillsQuery(
		dateRange,
		selectedDriver?.id,
		locationSearch,
		companySearch,
	);
	const { mutateAsync: insertWaybill } = useInsertWaybillMutation(() => {
		// 新增完成，馬上重置
		setTimeout(() => {
			setSelectedWaybill(R.clone(defaultWaybill));
		});
	});
	const { mutate: deleteWaybill } = useDeleteWaybillMutation();
	const { mutateAsync: updateWaybill } = useUpdateWaybillMutation();

	const { data: companies = [] } = useCompaniesQuery();
	const { data: drivers = [] } = useDriversQuery();
	const { mutate: insertCompany } = useInsertCompanyMutation();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const handleSelectWaybill = (waybill: Waybill) => {
		setSelectedWaybill(waybill);
		if (isMobile) {
			setFormDrawerOpen(true);
		}
	};

	const handleViewWaybill = (waybill: Waybill) => {
		setSelectedWaybill(waybill);
		if (isMobile) {
			setFormDrawerOpen(true);
		}
	};

	const handleNewWaybill = () => {
		setSelectedWaybill({ ...defaultWaybill });
		if (isMobile) {
			setFormDrawerOpen(true);
		}
	};

	const handleCloseForm = () => {
		if (isMobile) {
			setFormDrawerOpen(false);
		}
	};

	const handleDelete = (id: string) => {
		setDeleteId(id);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteWaybill(deleteId);
			setDeleteDialogOpen(false);
			setDeleteId(null);
			setSelectedWaybill(defaultWaybill);
		}
	};

	const handleSave = async (formData: WaybillFormData) => {
		if (formData.id) {
			await updateWaybill({ waybillId: formData.id, waybill: formData });
		} else {
			const newWaybill = {
				...formData,
				id: crypto.randomUUID(),
			};
			await insertWaybill(newWaybill as any);
		}
	};

	const handleDateChange = (start: Date, end: Date) => {
		setDateRange({ start, end });
	};

	const handleDriverChange = (driver: Driver | null) => {
		setSelectedDriver(driver);
	};

	// 創建 debounced 函式來更新搜尋狀態（延遲500ms）
	const debouncedSetLocationSearch = useMemo(
		() =>
			debounce((value: string) => {
				setLocationSearch(value);
			}, 500),
		[],
	);

	const debouncedSetCompanySearch = useMemo(
		() =>
			debounce((value: string) => {
				setCompanySearch(value);
			}, 500),
		[],
	);

	const handleLocationSearchChange = (search: string) => {
		setLocationSearchInput(search); // 立即更新輸入框顯示
		debouncedSetLocationSearch(search); // 延遲更新API查詢狀態
	};

	const handleCompanySearchChange = (search: string) => {
		setCompanySearchInput(search); // 立即更新輸入框顯示
		debouncedSetCompanySearch(search); // 延遲更新API查詢狀態
	};

	const handleAddCompany = (company: Company) => {
		insertCompany(company);
	};

	useEffect(() => {
		setSelectedWaybill(R.clone(defaultWaybill));
	}, []);

	// Cleanup debounced 函式避免記憶體洩漏
	useEffect(() => {
		return () => {
			debouncedSetLocationSearch.cancel();
			debouncedSetCompanySearch.cancel();
		};
	}, [debouncedSetLocationSearch, debouncedSetCompanySearch]);

	return (
		<>
			{/* 主頁面 - 響應式佈局 */}
			<Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
				{isMobile ? (
					// 手機版：單欄佈局
					<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
						<Box sx={{ p: 1, flexShrink: 0 }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
								<Button
									variant="contained"
									color="primary"
									onClick={handleNewWaybill}
									startIcon={<AddIcon />}
									size="small"
								>
									新增託運單
								</Button>
							</Stack>
							<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
							<Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
								<Button
									variant={selectedDriver === null ? 'contained' : 'outlined'}
									color="primary"
									onClick={() => handleDriverChange(null)}
									size="small"
								>
									全部
								</Button>
								{drivers.map((driver) => (
									<Button
										key={driver.id}
										variant={selectedDriver?.id === driver.id ? 'contained' : 'outlined'}
										color="primary"
										onClick={() => handleDriverChange(driver)}
										size="small"
									>
										{driver.name}
									</Button>
								))}
							</Stack>
							<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
								<TextField
									sx={{ flex: 1 }}
									label="搜尋地點"
									variant="outlined"
									size="small"
									value={locationSearchInput}
									onChange={(e) => handleLocationSearchChange(e.target.value)}
									placeholder="輸入起點或終點進行搜尋..."
								/>
								<TextField
									sx={{ flex: 1 }}
									label="搜尋貨主"
									variant="outlined"
									size="small"
									value={companySearchInput}
									onChange={(e) => handleCompanySearchChange(e.target.value)}
									placeholder="輸入貨主名稱進行搜尋..."
								/>
							</Stack>
						</Box>
						<Box sx={{ flex: 1, overflow: 'auto' }}>
							{isPending ? (
								<Skeleton variant="rectangular" height={500} />
							) : (
								<WaybillGrid
									waybills={waybills || []}
									onDelete={handleDelete}
									onSelect={handleSelectWaybill}
									onView={handleViewWaybill}
								/>
							)}
						</Box>
					</Box>
				) : (
					// 桌面版和平板版：左右佈局
					<Stack direction="row" spacing={1} sx={{ height: '100%', width: '100%', overflow: 'hidden', p: 1 }}>
						<Stack
							direction="column"
							spacing={1}
							sx={{
								flex: '1 1 auto',
								width: '100%',
								height: '100%',
								maxWidth: 'calc(100% - 558px)',
							}}
						>
							<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
							<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
								<Button
									variant={selectedDriver === null ? 'contained' : 'outlined'}
									color="primary"
									onClick={() => handleDriverChange(null)}
								>
									全部
								</Button>
								{drivers.map((driver) => (
									<Button
										key={driver.id}
										variant={selectedDriver?.id === driver.id ? 'contained' : 'outlined'}
										color="primary"
										onClick={() => handleDriverChange(driver)}
										size="small"
									>
										{driver.name}
									</Button>
								))}
							</Stack>
							<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
								<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
									<TextField
										label="搜尋地點"
										variant="outlined"
										size="small"
										value={locationSearchInput}
										onChange={(e) => handleLocationSearchChange(e.target.value)}
										placeholder="輸入起點或終點進行搜尋..."
										sx={{ mt: 1, maxWidth: '300px' }}
									/>
									<TextField
										label="搜尋貨主"
										variant="outlined"
										size="small"
										value={companySearchInput}
										onChange={(e) => handleCompanySearchChange(e.target.value)}
										placeholder="輸入貨主名稱進行搜尋..."
										sx={{ mt: 1, maxWidth: '300px' }}
									/>
								</Stack>
								<Button
									variant="contained"
									color="primary"
									onClick={handleNewWaybill}
									startIcon={<AddIcon />}
								>
									新增託運單
								</Button>
							</Stack>

							{isPending ? (
								<Skeleton variant="rectangular" height={500} />
							) : (
								<WaybillGrid
									waybills={waybills || []}
									onDelete={handleDelete}
									onSelect={handleSelectWaybill}
									onView={handleViewWaybill}
								/>
							)}
						</Stack>
						<WaybillForm
							companies={companies}
							drivers={drivers}
							onSave={handleSave}
							onAddCompany={handleAddCompany}
							initialData={selectedWaybill}
							readonly={selectedWaybill?.status !== 'PENDING'}
						/>
					</Stack>
				)}
			</Box>

			{/* 手機版表單 Drawer */}
			{isMobile && (
				<Drawer
					anchor="bottom"
					open={formDrawerOpen}
					onClose={handleCloseForm}
					PaperProps={{
						sx: {
							height: '90vh',
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
						},
					}}
				>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							p: 2,
							borderBottom: 1,
							borderColor: 'divider',
						}}
					>
						<Typography variant="h6">{selectedWaybill?.id ? '編輯託運單' : '新增託運單'}</Typography>
						<IconButton onClick={handleCloseForm}>
							<CloseIcon />
						</IconButton>
					</Box>
					<Box sx={{ flex: 1, overflow: 'auto' }}>
						<WaybillForm
							companies={companies}
							drivers={drivers}
							onSave={async (data) => {
								await handleSave(data);
								handleCloseForm();
							}}
							onAddCompany={handleAddCompany}
							initialData={selectedWaybill}
							readonly={selectedWaybill?.status !== 'PENDING'}
							isMobile
						/>
					</Box>
				</Drawer>
			)}
			{/* 刪除確認視窗 */}
			<Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
				<DialogTitle>確認刪除</DialogTitle>
				<DialogContent>確定要刪除這筆託運單嗎？</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
					<Button onClick={confirmDelete} color="error">
						刪除
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
