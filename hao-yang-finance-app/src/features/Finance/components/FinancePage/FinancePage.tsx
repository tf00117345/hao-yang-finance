import { Box, Button, Stack, Tab, Tabs } from '@mui/material';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useState } from 'react';
import MonthPicker from '../../../../component/MonthPicker/MonthPicker';
import { DateRange } from '../../../../types/date-range';
import { driversData } from '../../../Settings/constant/drivers-data';
import { Driver } from '../../../Settings/types/driver';
import { UninvoicedTable } from '../UninvoicedTable/UninvoicedTable';
import { useInvoicesQuery, useUninvoicedWaybillsQuery } from '../../api/query';
import { InvoicedTable } from '../InvoicedTable/InvoicedTable';

export default function FinancePage() {
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [dateRange, setDateRange] = useState<DateRange>({
		start: startOfMonth(new Date()),
		end: endOfMonth(new Date()),
	});

	// 狀態：分頁、發票、waybill
	const [tab, setTab] = useState(0);

	const { data: uninvoicedWaybills = [], isPending: isWaybillsPending } = useUninvoicedWaybillsQuery(
		dateRange,
		selectedDriver?.id,
	);
	const { data: invoices = [], isPending: isInvoicesPending } = useInvoicesQuery(dateRange);

	const handleDateChange = (start: Date, end: Date) => {
		setDateRange({ start, end });
	};

	// Tab 切換
	function handleTabChange(_: React.SyntheticEvent, newValue: number) {
		setTab(newValue);
	}

	return (
		<Stack direction="column" spacing={1} sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
			<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
			<Stack direction="row" spacing={1}>
				<Button
					variant={selectedDriver === null ? 'contained' : 'outlined'}
					color="primary"
					onClick={() => setSelectedDriver(null)}
				>
					全部
				</Button>
				{driversData.map((driver) => (
					<Button
						key={driver.id}
						variant={selectedDriver?.id === driver.id ? 'contained' : 'outlined'}
						color="primary"
						onClick={() => setSelectedDriver(driver)}
					>
						{driver.name}
					</Button>
				))}
			</Stack>
			<Box
				id="finance-table-container"
				sx={{
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					minHeight: 0, // 確保可以縮小
				}}
			>
				<Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
					<Tab label="未開立發票之貨運單" />
					<Tab label="已開立發票" />
				</Tabs>
				{tab === 0 && <UninvoicedTable waybills={uninvoicedWaybills} />}
				{/* {tab === 1 && <InvoicedTable invoices={invoices} waybills={uninvoicedWaybills} />} */}
			</Box>
		</Stack>
	);
}
