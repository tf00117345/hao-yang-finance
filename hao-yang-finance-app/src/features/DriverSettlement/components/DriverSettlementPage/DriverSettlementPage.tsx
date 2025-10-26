import { useMemo, useState } from 'react';

import { Add as AddIcon } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import MonthPicker from '../../../../component/MonthPicker/MonthPicker';
import { DateRange } from '../../../../types/date-range';
import { getDrivers } from '../../../Settings/api/api';
import { useDeleteDriverSettlement } from '../../api/mutation';
import { useDriverSettlement, useDriverSettlements } from '../../api/query';
import { DriverSettlement, DriverSettlementSummary } from '../../types/driver-settlement.types';
import DriverSettlementForm from '../DriverSettlementForm/DriverSettlementForm';

function DriverSettlementPage() {
	// State
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
	const [dateRange, setDateRange] = useState<DateRange>({
		start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
		end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
	});
	const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
	const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
	const [creatingForDriverId, setCreatingForDriverId] = useState<string | null>(null);

	// Queries
	const { data: settlements, isLoading: settlementsLoading } = useDriverSettlements(format(selectedMonth, 'yyyy-MM'));

	const { data: drivers, isLoading: driversLoading } = useQuery({
		queryKey: ['drivers'],
		queryFn: getDrivers,
	});

	// Mutations
	const deleteSettlementMutation = useDeleteDriverSettlement();

	// Calculate driver data with settlements
	const driverData = useMemo(() => {
		if (!drivers) return [];

		return drivers.map((driver) => ({
			driver,
			settlementSummary: settlements?.find((s: DriverSettlementSummary) => s.driverId === driver.id) || null,
		}));
	}, [drivers, settlements]);

	// Get full settlement details for current tab if it exists
	const currentDriverData = driverData[activeTabIndex];
	const currentSettlementId = currentDriverData?.settlementSummary?.settlementId;
	const { data: fullSettlement } = useDriverSettlement(currentSettlementId || 0, !!currentSettlementId);

	// Month picker handler
	const handleDateChange = (start: Date, _end: Date) => {
		// Only use the start date's year and month
		setSelectedMonth(new Date(start.getFullYear(), start.getMonth(), 1));
		setDateRange({ start, end: _end });
	};

	// Tab handlers
	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		if (editingTabIndex !== null) {
			if (window.confirm('您有未儲存的變更，是否要放棄？')) {
				setEditingTabIndex(null);
				setActiveTabIndex(newValue);
			}
		} else {
			setActiveTabIndex(newValue);
		}
	};

	// Form handlers
	const handleEdit = () => {
		setEditingTabIndex(activeTabIndex);
	};

	const handleCancel = () => {
		setEditingTabIndex(null);
	};

	const handleSuccess = () => {
		setEditingTabIndex(null);
	};

	const handleDelete = (settlement: DriverSettlement) => {
		if (window.confirm('確定要刪除這筆結算表嗎？')) {
			deleteSettlementMutation.mutate(settlement.settlementId, {
				onSuccess: () => {
					// If deleting current tab's settlement, stay on the tab but show empty state
					setEditingTabIndex(null);
				},
			});
		}
	};

	const handleCreateNew = (driverId: string) => {
		setCreatingForDriverId(driverId);
		setEditingTabIndex(activeTabIndex);
	};

	if (driversLoading || settlementsLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!drivers || drivers.length === 0) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="info">目前沒有司機資料，請先新增司機</Alert>
			</Box>
		);
	}

	// Determine mode and settlement to edit
	const mode =
		editingTabIndex === activeTabIndex || creatingForDriverId === currentDriverData?.driver.id ? 'edit' : 'view';
	const isCreating = creatingForDriverId === currentDriverData?.driver.id;

	return (
		<Box sx={{ p: 1 }}>
			<Typography variant="h4" gutterBottom>
				司機結算表
			</Typography>

			{/* Month Picker */}
			<Box sx={{ mb: 1 }}>
				<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
			</Box>

			{/* Driver Tabs */}
			<Paper sx={{ mb: 1 }}>
				<Tabs
					value={activeTabIndex}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					sx={{ borderBottom: 1, borderColor: 'divider' }}
				>
					{driverData.map((data, index) => (
						<Tab key={data.driver.id} label={data.driver.name} />
					))}
				</Tabs>
			</Paper>

			{/* Tab Content */}
			<Paper sx={{ p: 3 }}>
				{currentDriverData ? (
					fullSettlement || isCreating ? (
						// Driver has settlement or is creating new - show form
						<DriverSettlementForm
							key={fullSettlement?.settlementId || `new-${currentDriverData.driver.id}`}
							targetMonth={selectedMonth}
							driverId={currentDriverData.driver.id}
							editingSettlement={fullSettlement || null}
							mode={mode}
							onSuccess={() => {
								handleSuccess();
								setCreatingForDriverId(null);
							}}
							onCancel={() => {
								handleCancel();
								setCreatingForDriverId(null);
							}}
							onEdit={handleEdit}
							onDelete={fullSettlement ? () => handleDelete(fullSettlement) : undefined}
						/>
					) : (
						// Driver has no settlement - show empty state
						<Box sx={{ textAlign: 'center', py: 8 }}>
							<Typography variant="h6" color="text.secondary" gutterBottom>
								{currentDriverData.driver.name} 尚未建立 {format(selectedMonth, 'yyyy年MM月')} 的結算表
							</Typography>
							<Button
								variant="contained"
								startIcon={<AddIcon />}
								onClick={() => handleCreateNew(currentDriverData.driver.id)}
								sx={{ mt: 2 }}
							>
								建立結算表
							</Button>
						</Box>
					)
				) : (
					<Alert severity="info">無法載入司機資料</Alert>
				)}
			</Paper>
		</Box>
	);
}

export default DriverSettlementPage;
