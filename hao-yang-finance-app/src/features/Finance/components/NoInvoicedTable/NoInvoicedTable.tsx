import React, { useState, useMemo, useCallback } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptIcon from '@mui/icons-material/Receipt';
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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	CircularProgress,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';

import { useRestoreWaybillMutation } from '../../../Waybill/api/mutation';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useUninvoicedTable } from '../../hooks/useUninvoicedTable';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface NoInvoicedNeededTableProps {
	waybills: Waybill[];
}

export function NoInvoicedNeededTable({ waybills }: NoInvoicedNeededTableProps) {
	const [selectedWaybills, setSelectedWaybills] = useState<Waybill[]>([]);
	const [confirmNoInvoiceDialogOpen, setConfirmNoInvoiceDialogOpen] = useState(false);
	const [processingNoInvoice, setProcessingNoInvoice] = useState(false);

	// 未開立發票的 waybill
	const noInvoicedWaybills = useMemo(() => waybills.filter((b) => b.status === 'NO_INVOICE_NEEDED'), [waybills]);

	const { table } = useUninvoicedTable(noInvoicedWaybills);
	const restoreWaybillMutation = useRestoreWaybillMutation();

	// 處理無須開發票
	function handleOpenNoInvoiceDialog() {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			alert('請先選擇至少一筆資料');
			return;
		}

		setSelectedWaybills(selected);
		setConfirmNoInvoiceDialogOpen(true);
	}

	// 確認還原貨運單
	const handleConfirmRestoreWaybill = async () => {
		if (selectedWaybills.length === 0) return;

		setProcessingNoInvoice(true);

		try {
			// 逐一處理每筆託運單
			for (const waybill of selectedWaybills) {
				await restoreWaybillMutation.mutateAsync(waybill.id);
			}

			// 處理完成後清理狀態
			setConfirmNoInvoiceDialogOpen(false);
			setSelectedWaybills([]);
			table.resetRowSelection();
		} catch (error) {
			// 錯誤處理已由 mutation 的 onError 處理
			console.error('批次還原貨運單失敗:', error);
		} finally {
			setProcessingNoInvoice(false);
		}
	};

	// 分組與排序處理
	const handleGrouping = useCallback((e: React.MouseEvent, column: any) => {
		column.toggleGrouping();
		e.stopPropagation();
	}, []);

	const handleSorting = useCallback((e: React.MouseEvent, column: any) => {
		column.toggleSorting();
		e.stopPropagation();
	}, []);

	// 為表頭創建穩定的處理函數
	const headerHandlers = useMemo(() => {
		return table.getHeaderGroups().reduce(
			(acc, headerGroup) => {
				headerGroup.headers.forEach((header) => {
					if (header.column.getCanSort()) {
						acc[`sort-${header.id}`] = (e: React.MouseEvent) => handleSorting(e, header.column);
					}
					if (header.column.getCanGroup()) {
						acc[`group-${header.id}`] = (e: React.MouseEvent) => handleGrouping(e, header.column);
					}
				});
				return acc;
			},
			{} as Record<string, (e: React.MouseEvent) => void>,
		);
	}, [table, handleSorting, handleGrouping]);

	// 為行創建穩定的點擊處理函數
	const rowHandlers = useMemo(() => {
		return table.getRowModel().rows.reduce(
			(acc, row) => {
				acc[row.id] = () => row.getCanSelect() && row.toggleSelected();
				return acc;
			},
			{} as Record<string, () => void>,
		);
	}, [table]);

	// 渲染單元格內容的函數
	const renderCellContent = useCallback((cell: any, row: any) => {
		if (cell.column.id === 'select') {
			return (
				<Checkbox
					sx={{ p: 0 }}
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					onChange={row.getToggleSelectedHandler()}
					onClick={(e) => e.stopPropagation()}
				/>
			);
		}

		if (cell.getIsGrouped()) {
			return (
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
			);
		}

		if (cell.getIsAggregated()) {
			return flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext());
		}

		if (cell.getIsPlaceholder()) {
			return null;
		}

		return flexRender(cell.column.columnDef.cell, cell.getContext());
	}, []);

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
				<Stack direction="row" spacing={1}>
					<Typography sx={{ flex: '1 1 100%', px: 2 }} variant="h6" component="div">
						無須開發票之貨運單
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
					<Button
						sx={{ width: '120px' }}
						size="small"
						variant="contained"
						startIcon={<ReceiptIcon />}
						onClick={handleOpenNoInvoiceDialog}
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						還原貨運單
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
											header.column.getCanSort() ? headerHandlers[`sort-${header.id}`] : undefined
										}
										sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
									>
										{header.isPlaceholder ? null : (
											<Stack direction="row" alignItems="center" spacing={1}>
												{header.column.getCanGroup() && (
													<IconButton
														size="small"
														sx={{ color: 'inherit' }}
														onClick={headerHandlers[`group-${header.id}`]}
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
								onClick={rowHandlers[row.id]}
								sx={{
									cursor: row.getCanSelect() ? 'pointer' : 'default',
									bgcolor: row.getIsSelected() ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
								}}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell size="small" key={cell.id}>
										{renderCellContent(cell, row)}
									</TableCell>
								))}
							</StyledTableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<Dialog
				open={confirmNoInvoiceDialogOpen}
				onClose={() => setConfirmNoInvoiceDialogOpen(false)}
				aria-labelledby="confirm-no-invoice-dialog-title"
				aria-describedby="confirm-no-invoice-dialog-description"
			>
				<DialogTitle id="confirm-no-invoice-dialog-title">確認無須開發票</DialogTitle>
				<DialogContent>
					<DialogContentText id="confirm-no-invoice-dialog-description">
						您確定要將選擇的 {selectedWaybills.length} 筆貨運單標記為「無須開發票」嗎？
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmNoInvoiceDialogOpen(false)} color="primary">
						取消
					</Button>
					<Button
						onClick={handleConfirmRestoreWaybill}
						color="error"
						variant="contained"
						disabled={processingNoInvoice}
					>
						{processingNoInvoice ? <CircularProgress size={24} /> : '確認無須開發票'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
