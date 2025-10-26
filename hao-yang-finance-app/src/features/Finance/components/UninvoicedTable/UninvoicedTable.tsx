import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ArrowDownward, ArrowUpward, UnfoldMore } from '@mui/icons-material';
import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';

import {
	useMarkWaybillAsPendingPaymentMutation,
	useMarkWaybillsAsNoInvoiceNeededBatchMutation,
} from '../../../Waybill/api/mutation';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useStickyFilterTop } from '../../hooks/useStickyFilterTop';
import { useUninvoicedTable } from '../../hooks/useUninvoicedTable';
import { InvoiceDialog } from '../InvoiceDialog/InvoiceDialog';
import { SmartFilterInput } from '../shared/SmartFilterInput';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface UninvoicedTableProps {
	waybills: Waybill[];
}

export function UninvoicedTable({ waybills }: UninvoicedTableProps) {
	const isMountedRef = useRef(false);
	const [selectedWaybills, setSelectedWaybills] = useState<Waybill[]>([]);
	const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
	const [confirmNoInvoiceDialogOpen, setConfirmNoInvoiceDialogOpen] = useState(false);
	const [processingNoInvoice, setProcessingNoInvoice] = useState(false);
	const [pendingPaymentDialogOpen, setPendingPaymentDialogOpen] = useState(false);
	const [pendingPaymentWaybill, setPendingPaymentWaybill] = useState<Waybill | null>(null);
	const [pendingPaymentNotes, setPendingPaymentNotes] = useState('');
	const [processingPendingPayment, setProcessingPendingPayment] = useState(false);
	const { tableHeadRef, filterRowRef, filterTop } = useStickyFilterTop();

	const { table, columnFilters, setColumnFilters } = useUninvoicedTable(waybills);
	const markAsNoInvoiceNeededBatchMutation = useMarkWaybillsAsNoInvoiceNeededBatchMutation();
	const markAsPendingPaymentMutation = useMarkWaybillAsPendingPaymentMutation();

	// Track component mount status
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// 處理篩選變更
	const handleFilterChange = useCallback(
		(columnId: string, value: string) => {
			if (!isMountedRef.current) return;
			setColumnFilters((prev) =>
				prev.filter((filter) => filter.id !== columnId).concat(value ? [{ id: columnId, value }] : []),
			);
		},
		[setColumnFilters],
	);

	// 清除特定欄位的篩選
	const clearFilter = useCallback(
		(columnId: string) => {
			if (!isMountedRef.current) return;
			setColumnFilters((prev) => prev.filter((filter) => filter.id !== columnId));
		},
		[setColumnFilters],
	);

	// 取得特定欄位的篩選值
	const getFilterValue = useCallback(
		(columnId: string) => {
			return columnFilters.find((filter) => filter.id === columnId)?.value || '';
		},
		[columnFilters],
	);

	// 處理開立發票
	const handleOpenInvoiceDialog = useCallback(() => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			alert('請先選擇至少一筆資料');
			return;
		}

		setSelectedWaybills(selected);
		setInvoiceDialogOpen(true);
	}, [table]);

	// 處理無須開發票
	const handleOpenNoInvoiceDialog = useCallback(() => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			alert('請先選擇至少一筆資料');
			return;
		}

		setSelectedWaybills(selected);
		setConfirmNoInvoiceDialogOpen(true);
	}, [table]);

	// 處理標記為待收款
	const handleOpenPendingPaymentDialog = useCallback(() => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			// eslint-disable-next-line no-alert
			alert('請先選擇一筆資料');
			return;
		}
		if (selected.length > 1) {
			// eslint-disable-next-line no-alert
			alert('標記為待收款僅支援單筆操作，請只選擇一筆資料');
			return;
		}

		setPendingPaymentWaybill(selected[0]);
		setPendingPaymentNotes(selected[0].notes || '');
		setPendingPaymentDialogOpen(true);
	}, [table]);

	// 確認標記為無須開發票
	const handleConfirmNoInvoice = async () => {
		if (selectedWaybills.length === 0) return;

		setProcessingNoInvoice(true);

		try {
			// 使用批次 API 一次處理所有託運單
			const waybillIds = selectedWaybills.map((waybill) => waybill.id);
			await markAsNoInvoiceNeededBatchMutation.mutateAsync(waybillIds);

			// 處理完成後清理狀態
			setConfirmNoInvoiceDialogOpen(false);
			setSelectedWaybills([]);
			table.resetRowSelection();
		} catch (error) {
			// 錯誤處理已由 mutation 的 onError 處理
			console.error('批次標記無須開發票失敗:', error);
		} finally {
			setProcessingNoInvoice(false);
		}
	};

	// 確認標記為待收款
	const handleConfirmPendingPayment = async () => {
		if (!pendingPaymentWaybill) return;

		setProcessingPendingPayment(true);

		try {
			await markAsPendingPaymentMutation.mutateAsync({
				waybillId: pendingPaymentWaybill.id,
				notes: pendingPaymentNotes.trim(),
			});

			// 處理完成後清理狀態
			setPendingPaymentDialogOpen(false);
			setPendingPaymentWaybill(null);
			setPendingPaymentNotes('');
			table.resetRowSelection();
		} catch (error) {
			// 錯誤處理已由 mutation 的 onError 處理
			console.error('標記為待收款失敗:', error);
		} finally {
			setProcessingPendingPayment(false);
		}
	};

	// 開立發票成功後的處理
	const handleInvoiceCreated = useCallback(() => {
		// 關閉對話框並清理選擇狀態
		setInvoiceDialogOpen(false);
		setSelectedWaybills([]);
		// 清除 table 選擇狀態
		table.resetRowSelection();
	}, [table]);

	// 分組與排序處理
	const handleGrouping = useCallback((e: React.MouseEvent, column: any) => {
		column.toggleGrouping();
		e.stopPropagation();
	}, []);

	const handleSorting = useCallback((e: React.MouseEvent, column: any) => {
		column.toggleSorting();
		e.stopPropagation();
	}, []);

	const handleCloseInvoiceDialog = useCallback(() => {
		setInvoiceDialogOpen(false);
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
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
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
						color="warning"
						variant="contained"
						startIcon={<ReceiptIcon />}
						onClick={handleOpenNoInvoiceDialog}
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						無須開發票
					</Button>
					<Button
						sx={{ width: '120px' }}
						size="small"
						color="error"
						variant="contained"
						startIcon={<PaymentIcon />}
						onClick={handleOpenPendingPaymentDialog}
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						標記待收款
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
				<Table stickyHeader sx={{ tableLayout: 'fixed' }}>
					<TableHead ref={tableHeadRef}>
						{/* 表頭行 */}
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
										sx={{
											cursor: header.column.getCanSort() ? 'pointer' : 'default',
											width: header.getSize(),
											minWidth: header.column.columnDef.minSize || 120,
											userSelect: 'none',
											'&:hover': header.column.getCanSort()
												? { backgroundColor: 'action.hover' }
												: {},
										}}
									>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												position: 'relative',
											}}
										>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}

												{/* 排序指示器 */}
												{header.column.getCanSort() && (
													<Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
														{header.column.getIsSorted() === 'asc' && (
															<ArrowUpward
																sx={{ fontSize: '0.875rem', color: 'primary.main' }}
															/>
														)}
														{header.column.getIsSorted() === 'desc' && (
															<ArrowDownward
																sx={{ fontSize: '0.875rem', color: 'primary.main' }}
															/>
														)}
														{!header.column.getIsSorted() && (
															<UnfoldMore
																sx={{ fontSize: '0.875rem', color: 'text.disabled' }}
															/>
														)}
													</Box>
												)}
											</Box>

											{/* 列寬調整器 */}
											{header.column.getCanResize() && (
												<Box
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													sx={{
														position: 'absolute',
														right: 0,
														top: 0,
														height: '100%',
														width: '5px',
														cursor: 'col-resize',
														userSelect: 'none',
														touchAction: 'none',
														backgroundColor: header.column.getIsResizing()
															? 'primary.main'
															: 'transparent',
														'&:hover': {
															backgroundColor: 'primary.light',
														},
													}}
												/>
											)}
										</Box>
									</StyledTableCell>
								))}
							</TableRow>
						))}

						{/* 篩選行 */}
						<TableRow ref={filterRowRef}>
							{table.getHeaderGroups()[0].headers.map((header) => (
								<TableCell
									key={`filter-${header.id}`}
									sx={{
										py: 1,
										px: 1,
										position: 'sticky',
										top: filterTop,
										zIndex: 1,
										backgroundColor: '#FAFAFB',
									}}
								>
									{header.column.getCanFilter() && (
										<SmartFilterInput
											columnId={header.id}
											columnHeader={header.column.columnDef.header as string}
											value={getFilterValue(header.id) as string}
											onChange={(value) => handleFilterChange(header.id, value)}
											onClear={() => clearFilter(header.id)}
										/>
									)}
								</TableCell>
							))}
						</TableRow>
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
									<TableCell
										size="small"
										key={cell.id}
										sx={{
											width: cell.column.getSize(),
											maxWidth: cell.column.getSize(),
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{renderCellContent(cell, row)}
									</TableCell>
								))}
							</StyledTableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<InvoiceDialog
				open={invoiceDialogOpen}
				onClose={handleCloseInvoiceDialog}
				waybillList={selectedWaybills}
				onSuccess={handleInvoiceCreated}
			/>
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
						onClick={handleConfirmNoInvoice}
						color="error"
						variant="contained"
						disabled={processingNoInvoice}
					>
						{processingNoInvoice ? <CircularProgress size={24} /> : '確認無須開發票'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* 標記待收款對話框 */}
			<Dialog
				open={pendingPaymentDialogOpen}
				onClose={() => setPendingPaymentDialogOpen(false)}
				aria-labelledby="pending-payment-dialog-title"
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle id="pending-payment-dialog-title">標記為待收款 - {pendingPaymentWaybill?.id}</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 1 }}>
						將此託運單標記為「待收款」狀態，表示不需要開發票但款項未收齊。
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						label="收款備註"
						fullWidth
						multiline
						rows={4}
						variant="outlined"
						value={pendingPaymentNotes}
						onChange={(e) => setPendingPaymentNotes(e.target.value)}
						placeholder="請輸入收款相關備註，如：部分收款金額、預計收款時間等..."
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPendingPaymentDialogOpen(false)} color="primary">
						取消
					</Button>
					<Button
						onClick={handleConfirmPendingPayment}
						color="error"
						variant="contained"
						disabled={processingPendingPayment}
					>
						{processingPendingPayment ? <CircularProgress size={24} /> : '確認標記'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
