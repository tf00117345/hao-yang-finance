import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Skeleton, Stack } from '@mui/material';
import { endOfMonth, startOfMonth } from 'date-fns';

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

const defaultWaybill: Waybill = {
	id: '',
	// waybillNumber: '',
	date: new Date().toISOString().split('T')[0],
	item: '',
	companyName: '',
	companyId: '',
	loadingLocations: [{ from: '車廠', to: '' }],
	workingTime: { start: '', end: '' },
	fee: 5000,
	driverName: '黃天賜',
	driverId: '32dde0f7-9274-4813-be36-adab21c415f3',
	plateNumber: '11',
	notes: '',
	extraExpenses: [],
	status: 'PENDING',
	tonnage: 11,
};

export default function WaybillPage() {
	const [dateRange, setDateRange] = useState<{
		start: Date;
		end: Date;
	}>({
		start: startOfMonth(new Date()),
		end: endOfMonth(new Date()),
	});

	const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null);
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

	const { data: waybills = [], isPending } = useWaybillsQuery(dateRange, selectedDriver?.id);
	const { mutate: insertWaybill } = useInsertWaybillMutation();
	const { mutate: deleteWaybill } = useDeleteWaybillMutation();
	const { mutate: updateWaybill } = useUpdateWaybillMutation();

	const { data: companies = [] } = useCompaniesQuery();
	const { data: drivers = [] } = useDriversQuery();
	const { mutate: insertCompany } = useInsertCompanyMutation();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const handleSelectWaybill = (waybill: Waybill) => {
		setSelectedWaybill(waybill);
	};

	const handleViewWaybill = (waybill: Waybill) => {
		setSelectedWaybill(waybill);
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

	const handleSave = (formData: WaybillFormData) => {
		if (formData.id) {
			updateWaybill({ waybillId: formData.id, waybill: formData });
		} else {
			const newWaybill = {
				...formData,
				id: crypto.randomUUID(),
			};
			insertWaybill(newWaybill);
		}
	};

	const handleDateChange = (start: Date, end: Date) => {
		setDateRange({ start, end });
	};

	const handleDriverChange = (driver: Driver | null) => {
		setSelectedDriver(driver);
	};

	const handleAddCompany = (company: Company) => {
		insertCompany(company);
	};

	return (
		<>
			{/* 主頁面 */}
			<Stack direction="row" spacing={1} sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
				<Stack direction="column" spacing={1} sx={{ flex: '1 1 auto', width: '100%', height: '100%' }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
						<Button
							variant="contained"
							color="primary"
							onClick={() => setSelectedWaybill({ ...defaultWaybill })}
							sx={{ mb: 2 }}
							startIcon={<AddIcon />}
						>
							新增託運單
						</Button>
					</Stack>
					<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
					<Stack direction="row" spacing={1}>
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
							>
								{driver.name}
							</Button>
						))}
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
