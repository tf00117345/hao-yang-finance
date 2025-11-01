import { useState } from 'react';

import { Box, Button, Stack, Tab, Tabs } from '@mui/material';
import { endOfMonth, format, startOfMonth } from 'date-fns';

import MonthPicker from '../../../../component/MonthPicker/MonthPicker';
import { DateRange } from '../../../../types/date-range';
import { useDriversQuery } from '../../../Settings/api/query';
import { Driver } from '../../../Settings/types/driver';
import { useWaybillsByIdsQuery, useWaybillsQuery } from '../../../Waybill/api/query';
import { WaybillStatus } from '../../../Waybill/types/waybill-status.types';
import { useInvoicesQuery } from '../../api/query';
import { Invoice } from '../../types/invoice.type';
import { InvoiceDialog } from '../InvoiceDialog/InvoiceDialog';
import { InvoicedTable } from '../InvoicedTable/InvoicedTable';
import { NoInvoicedNeededTable } from '../NoInvoicedTable/NoInvoicedTable';
import { PendingPaymentTable } from '../PendingPaymentTable/PendingPaymentTable';
import { UninvoicedTable } from '../UninvoicedTable/UninvoicedTable';

export default function FinancePage() {
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [dateRange, setDateRange] = useState<DateRange>({
		start: startOfMonth(new Date()),
		end: endOfMonth(new Date()),
	});

	const { data: drivers = [] } = useDriversQuery();

	// 狀態：分頁、發票、waybill
	const [tab, setTab] = useState(0);
	const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	// 獲取所有waybills，然後篩選未開立發票的
	const startDate = format(dateRange.start, 'yyyy-MM-dd');
	const endDate = format(dateRange.end, 'yyyy-MM-dd');
	const { data: allWaybills = [], isPending: isWaybillsPending } = useWaybillsQuery(dateRange, selectedDriver?.id);

	// 篩選未開立發票的waybills (PENDING狀態)
	const uninvoicedWaybills = allWaybills.filter((waybill) => waybill.status === WaybillStatus.PENDING);
	const noInvoicedNeededWaybills = allWaybills.filter(
		(waybill) => waybill.status === WaybillStatus.NO_INVOICE_NEEDED,
	);
	const pendingPaymentWaybills = allWaybills.filter((waybill) => waybill.status === WaybillStatus.PENDING_PAYMENT);

	// 獲取發票列表
	const { data: invoices = [], isPending: isInvoicesPending } = useInvoicesQuery({
		startDate,
		endDate,
	});

	const handleDateChange = (start: Date, end: Date) => {
		setDateRange({ start, end });
	};

	// Tab 切換
	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTab(newValue);
	};

	// 處理編輯發票
	const handleEditInvoice = (invoice: Invoice) => {
		setEditingInvoice(invoice);
		setEditDialogOpen(true);
	};

	// 處理編輯對話框關閉
	const handleEditDialogClose = () => {
		setEditDialogOpen(false);
		setEditingInvoice(null);
	};

	// 處理編輯成功
	const handleEditSuccess = () => {
		handleEditDialogClose();
	};

	// 依發票中的 waybillId 直接取得完整託運單資料（不受目前日期/司機篩選影響）
	const editingWaybillIds = editingInvoice ? editingInvoice.waybills.map((iw) => iw.waybillId) : [];
	const { data: editingWaybills = [] } = useWaybillsByIdsQuery(editingWaybillIds);

	return (
		<Stack direction="column" spacing={1} sx={{ height: '100%', width: '100%', overflow: 'hidden', p: 1 }}>
			<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
			<Stack direction="row" spacing={1}>
				<Button
					variant={selectedDriver === null ? 'contained' : 'outlined'}
					color="primary"
					onClick={() => setSelectedDriver(null)}
				>
					全部
				</Button>
				{drivers.map((driver) => (
					<Button
						key={driver.id}
						size="small"
						variant={selectedDriver?.id === driver.id ? 'contained' : 'outlined'}
						color="primary"
						onClick={() => {
							setSelectedDriver(driver);
						}}
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
				<Tabs value={tab} onChange={handleTabChange} sx={{ mb: 1 }}>
					<Tab label="未開立發票之貨運單" />
					<Tab label="公司收現金之貨運單" />
					<Tab label="司機收現金之貨運單" />
					<Tab label="已開立發票" />
				</Tabs>
				{tab === 0 && <UninvoicedTable waybills={uninvoicedWaybills} />}
				{tab === 1 && <PendingPaymentTable waybills={pendingPaymentWaybills} />}
				{tab === 2 && <NoInvoicedNeededTable waybills={noInvoicedNeededWaybills} />}
				{tab === 3 && <InvoicedTable invoices={invoices} onEdit={handleEditInvoice} />}
			</Box>

			{/* 編輯發票對話框 */}
			{editingInvoice && (
				<InvoiceDialog
					open={editDialogOpen}
					onClose={handleEditDialogClose}
					waybillList={editingWaybills}
					editingInvoice={editingInvoice}
					onSuccess={handleEditSuccess}
				/>
			)}
		</Stack>
	);
}
