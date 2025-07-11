import React, { useState } from 'react';
import { useMemo } from 'react';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
	Button,
	Checkbox,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	IconButton,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { Invoice } from '../../types/invoice.type';
import { InvoiceDialog } from '../InvoiceDialog/InvoiceDialog';
import GroupIcon from '@mui/icons-material/Group';
import CancelIcon from '@mui/icons-material/Cancel';
import { useUninvoicedTable } from '../../hooks/useUninvoicedTable';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface UninvoicedTableProps {
	waybills: Waybill[];
}

export function UninvoicedTable({ waybills }: UninvoicedTableProps) {
	const [selectedWaybills, setSelectedWaybills] = useState<Waybill[]>([]);
	const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

	// 未開立發票的 waybill
	const unInvoicedWaybills = useMemo(() => waybills.filter((b) => !b.isInvoiceIssued), [waybills]);

	const { table } = useUninvoicedTable(unInvoicedWaybills);

	// 處理開立發票
	function handleOpenInvoiceDialog() {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			alert('請先選擇至少一筆資料');
			return;
		}

		setSelectedWaybills(selected);
		setInvoiceDialogOpen(true);
	}

	// 實際 mock 開立發票
	function handleCreateInvoice(description: string) {
		if (selectedWaybills.length === 0) return;
		const customer = selectedWaybills[0];
		const waybillIds = selectedWaybills.map((b) => b.id!).filter(Boolean);
		const amount = selectedWaybills.reduce(
			(sum, b) => sum + (b.fee + (b.extraExpenses?.reduce((acc, e) => acc + +e.fee, 0) || 0)) * 1.2,
			0,
		);
		const now = new Date().toISOString();
		const newInvoice: Invoice = {
			id: `inv-${Date.now()}`,
			customerId: customer.customerId || '',
			customerName: customer.customerName,
			date: now.slice(0, 10),
			amount,
			description,
			waybillIds,
			status: 'issued',
			createdAt: now,
			updatedAt: now,
		};
		// setInvoices((prev) => [newInvoice, ...prev]);
		// 更新 waybill 狀態
		// setWaybills((prev) =>
		// 	prev.map((b) =>
		// 		waybillIds.includes(b.id!) ? { ...b, isInvoiceIssued: true, invoiceId: newInvoice.id } : b,
		// 	),
		// );
		setInvoiceDialogOpen(false);
		setSelectedWaybills([]);
	}

	// 分組與排序處理
	function handleGrouping(e: React.MouseEvent, column: any) {
		column.toggleGrouping();
		e.stopPropagation();
	}

	function handleSorting(e: React.MouseEvent, column: any) {
		column.toggleSorting();
		e.stopPropagation();
	}

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
				<Stack direction="row" spacing={1}>
					<Typography sx={{ flex: '1 1 100%', px: 2 }} variant="h6" component="div">
						未開立發票之貨運單
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
					<Button
						sx={{ width: '100px' }}
						size="small"
						variant="contained"
						startIcon={<ReceiptIcon />}
						onClick={handleOpenInvoiceDialog}
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						開發票
					</Button>
					<Button
						sx={{ width: '120px' }}
						size="small"
						variant="contained"
						startIcon={<ReceiptIcon />}
						onClick={handleOpenInvoiceDialog}
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						無須開發票
					</Button>
				</Stack>
			</Stack>
			<TableContainer
				component={Paper}
				sx={{
					flex: 1,
					overflow: 'auto',
					border: '1px solid #E0E0E0',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Table stickyHeader>
					<TableHead>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<StyledTableCell
										size="small"
										key={header.id}
										colSpan={header.colSpan}
										onClick={
											header.column.getCanSort()
												? (e) => handleSorting(e, header.column)
												: undefined
										}
										sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
									>
										{header.isPlaceholder ? null : (
											<Stack direction="row" alignItems="center" spacing={1}>
												{header.column.getCanGroup() && (
													<IconButton
														size="small"
														sx={{ color: 'inherit' }}
														onClick={(e) => handleGrouping(e, header.column)}
													>
														{header.column.getIsGrouped() ? (
															<CancelIcon fontSize="small" sx={{ color: 'red' }} />
														) : (
															<GroupIcon fontSize="small" sx={{ color: '#2196F3' }} />
														)}
													</IconButton>
												)}
												{flexRender(header.column.columnDef.header, header.getContext())}
												{(header.column.getCanSort() &&
													{
														asc: ' 🔼',
														desc: ' 🔽',
													}[header.column.getIsSorted() as string]) ??
													null}
											</Stack>
										)}
									</StyledTableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<StyledTableRow
								key={row.id}
								onClick={() => row.getCanSelect() && row.toggleSelected()}
								sx={{
									cursor: row.getCanSelect() ? 'pointer' : 'default',
									bgcolor: row.getIsSelected() ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
								}}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell size="small" key={cell.id}>
										{cell.column.id === 'select' ? (
											<Checkbox
												sx={{ p: 0 }}
												checked={row.getIsSelected()}
												disabled={!row.getCanSelect()}
												onChange={row.getToggleSelectedHandler()}
												onClick={(e) => e.stopPropagation()}
											/>
										) : cell.getIsGrouped() ? (
											<Stack direction="row" alignItems="center" spacing={1}>
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														row.getToggleExpandedHandler()();
													}}
													sx={{
														cursor: row.getCanExpand() ? 'pointer' : 'default',
													}}
												>
													{row.getIsExpanded() ? (
														<ExpandMoreIcon fontSize="small" />
													) : (
														<ChevronRightIcon fontSize="small" />
													)}
												</IconButton>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
												<span>({row.subRows.length})</span>
											</Stack>
										) : cell.getIsAggregated() ? (
											flexRender(
												cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
												cell.getContext(),
											)
										) : cell.getIsPlaceholder() ? null : (
											flexRender(cell.column.columnDef.cell, cell.getContext())
										)}
									</TableCell>
								))}
							</StyledTableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<InvoiceDialog
				open={invoiceDialogOpen}
				onClose={() => setInvoiceDialogOpen(false)}
				onCreate={handleCreateInvoice}
				waybillList={selectedWaybills}
			/>
		</Stack>
	);
}
