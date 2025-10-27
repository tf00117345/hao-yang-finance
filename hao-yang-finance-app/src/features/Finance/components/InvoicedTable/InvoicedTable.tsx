import React, { useCallback, useMemo, useState } from 'react';

import { ArrowDownward, ArrowUpward, Assessment, UnfoldMore } from '@mui/icons-material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
	Box,
	Button,
	Chip,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
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
import { Controller, useForm } from 'react-hook-form';

import ConfirmDialog from '../../../../component/ConfirmDialog/ConfirmDialog';
import {
	useDeleteInvoiceMutation,
	useMarkInvoicePaidMutation,
	useRestoreInvoiceMutation,
	useVoidInvoiceMutation,
} from '../../api/mutation';
import { useInvoiceTable } from '../../hooks/useInvoiceTable';
import { useStickyFilterTop } from '../../hooks/useStickyFilterTop';
import { Invoice, MarkInvoicePaidRequest } from '../../types/invoice.type';
import CompanyLabelsPrint from '../CompanyLabelsPrint/CompanyLabelsPrint';
import InvoicedWaybillSubTable from '../InvoiceWaybillSubTable/InvoiceWaybillSubTable';
import { SmartFilterInput } from '../shared/SmartFilterInput';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface InvoicedTableProps {
	invoices: Invoice[];
	onEdit?: (invoice: Invoice) => void;
}

export function InvoicedTable({ invoices, onEdit }: InvoicedTableProps) {
	const voidMutation = useVoidInvoiceMutation();
	const markPaidMutation = useMarkInvoicePaidMutation();
	const deleteMutation = useDeleteInvoiceMutation();
	const restoreMutation = useRestoreInvoiceMutation();
	const { tableHeadRef, filterRowRef, filterTop } = useStickyFilterTop();

	// 對話框狀態管理
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
	const [statsDialogOpen, setStatsDialogOpen] = useState(false);

	// 列印貼紙對話框
	const [printDialogOpen, setPrintDialogOpen] = useState(false);
	const companyIdsForPrint = useMemo(() => {
		const ids = invoices.filter((i) => i.status === 'issued').map((i) => i.companyId);
		return Array.from(new Set(ids));
	}, [invoices]);

	// 通用確認對話框狀態
	type ConfirmAction = 'void' | 'restore' | 'delete';
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		action: ConfirmAction | null;
		invoice: Invoice | null;
	}>({ open: false, action: null, invoice: null });

	// 收款表單
	const {
		control: paymentControl,
		handleSubmit: handlePaymentSubmit,
		reset: resetPayment,
		formState: { errors: paymentErrors },
	} = useForm<MarkInvoicePaidRequest>({
		defaultValues: {
			paymentMethod: '',
			paymentNote: '',
		},
	});

	// 操作處理函數（改為先確認再執行）
	const handleVoidInvoice = useCallback((invoice: Invoice) => {
		setConfirmState({ open: true, action: 'void', invoice });
	}, []);

	// 恢復發票到已開立
	const handleRestoreInvoice = useCallback((invoice: Invoice) => {
		setConfirmState({ open: true, action: 'restore', invoice });
	}, []);

	// 刪除發票
	const handleDeleteInvoice = useCallback((invoice: Invoice) => {
		setConfirmState({ open: true, action: 'delete', invoice });
	}, []);

	const handleMarkPaid = useCallback((invoice: Invoice) => {
		setSelectedInvoice(invoice);
		setPaymentDialogOpen(true);
	}, []);

	const handleEditInvoice = useCallback(
		(invoice: Invoice) => {
			if (onEdit) {
				onEdit(invoice);
			}
		},
		[onEdit],
	);

	const handleViewInvoice = useCallback((invoice: Invoice) => {
		setViewingInvoice(invoice);
		setViewDialogOpen(true);
	}, []);

	// 收款表單提交
	const onPaymentSubmit = useCallback(
		(data: MarkInvoicePaidRequest) => {
			if (selectedInvoice) {
				markPaidMutation.mutate(
					{ id: selectedInvoice.id, data },
					{
						onSuccess: () => {
							setPaymentDialogOpen(false);
							resetPayment();
							setSelectedInvoice(null);
						},
					},
				);
			}
		},
		[selectedInvoice, markPaidMutation, resetPayment],
	);

	// 確認對話框：確認執行
	const confirmDialogConfirm = useCallback(() => {
		if (!confirmState.open || !confirmState.action || !confirmState.invoice) return;
		const { id } = confirmState.invoice;
		switch (confirmState.action) {
			case 'void':
				voidMutation.mutate(id, {
					onSettled: () => setConfirmState({ open: false, action: null, invoice: null }),
				});
				break;
			case 'restore':
				restoreMutation.mutate(id, {
					onSettled: () => setConfirmState({ open: false, action: null, invoice: null }),
				});
				break;
			case 'delete':
				deleteMutation.mutate(id, {
					onSettled: () => setConfirmState({ open: false, action: null, invoice: null }),
				});
				break;
			default:
		}
	}, [confirmState, voidMutation, restoreMutation, deleteMutation]);

	const confirmDialogClose = useCallback(() => {
		if (voidMutation.isPending || restoreMutation.isPending || deleteMutation.isPending) return;
		setConfirmState({ open: false, action: null, invoice: null });
	}, [voidMutation.isPending, restoreMutation.isPending, deleteMutation.isPending]);

	// 狀態 Chip 組件
	const getStatusChip = useCallback((status: string) => {
		switch (status) {
			case 'issued':
				return <Chip label="未收款" color="primary" size="small" />;
			case 'paid':
				return <Chip label="已收款" color="success" size="small" />;
			case 'void':
				return <Chip label="已作廢" color="default" size="small" />;
			default:
				return <Chip label={status} size="small" />;
		}
	}, []);

	// 操作按鈕組件
	const renderActionButtons = useCallback(
		(invoice: Invoice) => {
			if (invoice.status === 'issued') {
				return (
					<Stack direction="row" spacing={1}>
						<Button size="small" variant="outlined" onClick={() => handleViewInvoice(invoice)}>
							查看
						</Button>
						<Button
							size="small"
							variant="contained"
							color="success"
							onClick={() => handleMarkPaid(invoice)}
						>
							收款
						</Button>
						<Button size="small" variant="contained" onClick={() => handleEditInvoice(invoice)}>
							編輯
						</Button>
						<Button
							size="small"
							variant="contained"
							color="warning"
							onClick={() => handleVoidInvoice(invoice)}
						>
							作廢
						</Button>
						<Button
							size="small"
							variant="contained"
							color="error"
							onClick={() => handleDeleteInvoice(invoice)}
						>
							刪除
						</Button>
					</Stack>
				);
			}

			if (invoice.status === 'paid' || invoice.status === 'void') {
				return (
					<Stack direction="row" spacing={1}>
						<Button size="small" variant="outlined" onClick={() => handleViewInvoice(invoice)}>
							查看
						</Button>
						<Button
							size="small"
							variant="contained"
							color={invoice.status === 'void' ? 'warning' : 'success'}
							onClick={() => handleRestoreInvoice(invoice)}
						>
							恢復發票到已開立
						</Button>
					</Stack>
				);
			}

			return null;
		},
		[
			handleMarkPaid,
			handleEditInvoice,
			handleVoidInvoice,
			handleDeleteInvoice,
			handleRestoreInvoice,
			handleViewInvoice,
		],
	);

	// 渲染表頭內容的函數
	const renderHeaderContent = useCallback((header: any) => {
		if (header.id === 'expander') {
			return (
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<span style={{ marginLeft: 24 }}>
						{flexRender(header.column.columnDef.header, header.getContext())}
					</span>
				</Box>
			);
		}

		if (header.isPlaceholder) {
			return null;
		}

		return flexRender(header.column.columnDef.header, header.getContext());
	}, []);

	// 渲染單元格內容的函數
	const renderCellContent = useCallback(
		(cell: any, row: any) => {
			if (cell.column.id === 'expander') {
				return (
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<IconButton size="small" onClick={() => row.toggleExpanded()} style={{ marginRight: 8 }}>
							{row.getIsExpanded() ? (
								<ExpandMoreIcon fontSize="small" />
							) : (
								<ChevronRightIcon fontSize="small" />
							)}
						</IconButton>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</Box>
				);
			}

			if (cell.column.id === 'actions') {
				return renderActionButtons(row.original);
			}

			if (cell.column.id === 'status') {
				return getStatusChip(row.original.status);
			}

			return flexRender(cell.column.columnDef.cell, cell.getContext());
		},
		[renderActionButtons, getStatusChip],
	);

	const { table, tableStats } = useInvoiceTable({
		data: invoices,
		onVoidInvoice: (invoiceId) => voidMutation.mutate(invoiceId),
		onEditInvoice: onEdit,
		onMarkPaid: (invoiceId) =>
			markPaidMutation.mutate({ id: invoiceId, data: { paymentMethod: '', paymentNote: '' } }),
		onDeleteInvoice: (invoiceId) => deleteMutation.mutate(invoiceId),
	});

	// 處理篩選變更 - 使用 table 的內建方法
	const handleFilterChange = (columnId: string, value: string) => {
		table.getColumn(columnId)?.setFilterValue(value);
	};

	// 清除特定欄位的篩選
	const clearFilter = (columnId: string) => {
		table.getColumn(columnId)?.setFilterValue(undefined);
	};

	// 取得特定欄位的篩選值
	const getFilterValue = (columnId: string) => {
		return table.getColumn(columnId)?.getFilterValue() || '';
	};

	// 供 ConfirmDialog 顯示的文案與樣式（使用 useMemo 提升可讀性並避免巢狀三元）
	const isConfirming = useMemo(() => {
		switch (confirmState.action) {
			case 'void':
				return voidMutation.isPending;
			case 'restore':
				return restoreMutation.isPending;
			case 'delete':
				return deleteMutation.isPending;
			default:
				return false;
		}
	}, [confirmState.action, voidMutation.isPending, restoreMutation.isPending, deleteMutation.isPending]);

	const confirmConfig = useMemo(() => {
		if (!confirmState.action || !confirmState.invoice) {
			return {
				title: '',
				description: '',
				confirmText: '確認',
				confirmColor: 'primary' as const,
			};
		}
		switch (confirmState.action) {
			case 'void':
				return {
					title: '確認作廢發票？',
					description: `發票號碼：${confirmState.invoice.invoiceNumber}。作廢後將無法使用。仍要作廢嗎？`,
					confirmText: '作廢',
					confirmColor: 'warning' as const,
				};
			case 'restore':
				return {
					title: '確認恢復發票？',
					description: `發票號碼：${confirmState.invoice.invoiceNumber}。將恢復為已開立狀態。仍要恢復嗎？`,
					confirmText: '恢復',
					confirmColor: 'success' as const,
				};
			case 'delete':
				return {
					title: '確認刪除發票？',
					description: `發票號碼：${confirmState.invoice.invoiceNumber}。刪除後將無法復原。仍要刪除嗎？`,
					confirmText: '刪除',
					confirmColor: 'error' as const,
				};
			default:
				return {
					title: '',
					description: '',
					confirmText: '確認',
					confirmColor: 'primary' as const,
				};
		}
	}, [confirmState]);

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
				<Stack direction="row" spacing={1}>
					<Typography sx={{ flex: '1 1 100%', px: 2 }} variant="h6" component="div">
						已開立發票清單
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="outlined"
						startIcon={<Assessment />}
						onClick={() => setStatsDialogOpen(true)}
					>
						查看統計
					</Button>
					<Button
						size="small"
						variant="contained"
						startIcon={!printDialogOpen ? <StickyNote2Icon /> : <ViewListIcon />}
						onClick={() => setPrintDialogOpen((prev) => !prev)}
					>
						{!printDialogOpen ? '顯示貼紙' : '顯示發票清單'}
					</Button>
				</Stack>
			</Stack>

			<TableContainer
				component={Paper}
				id="invoiced-table-container"
				sx={{
					flex: 1,
					overflow: 'auto',
					border: '1px solid #E0E0E0',
					display: printDialogOpen ? 'none' : 'block',
				}}
			>
				<Table stickyHeader sx={{ minWidth: 1700, width: 'max-content' }}>
					<TableHead ref={tableHeadRef}>
						{/* 表頭行 */}
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const isPinned = header.column.getIsPinned();
									return (
										<StyledTableCell
											key={header.id}
											size="small"
											onClick={header.column.getToggleSortingHandler()}
											sx={{
												width: header.getSize(),
												minWidth: header.column.columnDef.minSize || 120,
												cursor: header.column.getCanSort() ? 'pointer' : 'default',
												background: '#FAFAFB !important',
												userSelect: 'none',
												'&:hover': header.column.getCanSort()
													? { backgroundColor: 'action.hover' }
													: {},
												// 固定列样式
												...(isPinned && {
													position: 'sticky',
													right: isPinned === 'right' ? 0 : undefined,
													zIndex: 2,
													boxShadow:
														isPinned === 'right' ? '-2px 0 4px rgba(0,0,0,0.1)' : undefined,
												}),
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
													{renderHeaderContent(header)}

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
																	sx={{
																		fontSize: '0.875rem',
																		color: 'text.disabled',
																	}}
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
															width: '3px',
															cursor: 'col-resize',
															userSelect: 'none',
															touchAction: 'none',
															backgroundColor: header.column.getIsResizing()
																? 'primary.main'
																: 'rgba(0, 0, 0, 0.12)',
															'&:hover': {
																backgroundColor: 'primary.light',
															},
														}}
													/>
												)}
											</Box>
										</StyledTableCell>
									);
								})}
							</TableRow>
						))}

						{/* 篩選行 */}
						<TableRow ref={filterRowRef}>
							{table.getHeaderGroups()[0].headers.map((header) => {
								const isPinned = header.column.getIsPinned();
								return (
									<TableCell
										key={`filter-${header.id}`}
										size="small"
										sx={{
											py: 1,
											px: 1,
											position: 'sticky',
											top: filterTop,
											zIndex: isPinned ? 3 : 1,
											backgroundColor: '#FAFAFB',
											// 固定列样式
											...(isPinned && {
												right: isPinned === 'right' ? 0 : undefined,
												boxShadow:
													isPinned === 'right' ? '-2px 0 4px rgba(0,0,0,0.1)' : undefined,
											}),
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
								);
							})}
						</TableRow>
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<React.Fragment key={row.id}>
								<StyledTableRow>
									{row.getVisibleCells().map((cell) => {
										const isPinned = cell.column.getIsPinned();
										return (
											<TableCell
												key={cell.id}
												size="small"
												sx={{
													width: cell.column.getSize(),
													minWidth: cell.column.getSize(),
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													// 固定列样式
													...(isPinned && {
														position: 'sticky',
														right: isPinned === 'right' ? 0 : undefined,
														zIndex: 1,
														backgroundColor: '#fff',
														boxShadow:
															isPinned === 'right'
																? '-2px 0 4px rgba(0,0,0,0.1)'
																: undefined,
													}),
												}}
											>
												{renderCellContent(cell, row)}
											</TableCell>
										);
									})}
								</StyledTableRow>
								{row.getIsExpanded() && (
									<TableRow>
										<TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
											<Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
												<InvoicedWaybillSubTable invoice={row.original} />
											</Collapse>
										</TableCell>
									</TableRow>
								)}
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* 收款對話框 */}
			<Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>標記發票收款</DialogTitle>
				<form onSubmit={handlePaymentSubmit(onPaymentSubmit)}>
					<DialogContent>
						<Stack spacing={3} sx={{ mt: 1 }}>
							{selectedInvoice && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										發票號碼: {selectedInvoice.invoiceNumber}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										金額: ${selectedInvoice.total.toLocaleString()}
									</Typography>
								</Box>
							)}

							<Controller
								name="paymentMethod"
								control={paymentControl}
								rules={{ required: '請選擇付款方式' }}
								render={({ field }) => (
									<FormControl fullWidth error={!!paymentErrors.paymentMethod}>
										<InputLabel>付款方式</InputLabel>
										<Select {...field} label="付款方式">
											<MenuItem value="現金">現金</MenuItem>
											<MenuItem value="轉帳">轉帳</MenuItem>
											<MenuItem value="支票">支票</MenuItem>
											<MenuItem value="信用卡">信用卡</MenuItem>
											<MenuItem value="其他">其他</MenuItem>
										</Select>
										{paymentErrors.paymentMethod && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
												{paymentErrors.paymentMethod.message}
											</Typography>
										)}
									</FormControl>
								)}
							/>

							<Controller
								name="paymentNote"
								control={paymentControl}
								render={({ field }) => (
									<TextField
										{...field}
										label="收款備註"
										fullWidth
										multiline
										rows={3}
										placeholder="可填寫收款詳細資訊、參考號碼等..."
									/>
								)}
							/>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setPaymentDialogOpen(false)}>取消</Button>
						<Button type="submit" variant="contained" disabled={markPaidMutation.isPending}>
							確認收款
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* 通用確認對話框（作廢／恢復／刪除） */}
			<ConfirmDialog
				open={confirmState.open}
				title={confirmConfig.title}
				description={confirmConfig.description}
				confirmText={confirmConfig.confirmText}
				confirmColor={confirmConfig.confirmColor}
				isConfirming={isConfirming}
				onClose={confirmDialogClose}
				onConfirm={confirmDialogConfirm}
			/>

			{/* 統計資訊對話框 */}
			<Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>
					<Stack direction="row" alignItems="center" gap={1}>
						<Assessment color="primary" />
						<Typography variant="h6">發票統計資訊</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={3}>
						{/* 發票張數 */}
						<Box>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								發票張數
							</Typography>
							<Typography variant="h4" fontWeight="bold" color="primary">
								{tableStats.validInvoiceCount} 張
							</Typography>
							<Typography variant="caption" color="text.secondary">
								（不含已作廢的發票）
							</Typography>
						</Box>

						{/* 發票總額 */}
						<Box>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								發票總額
							</Typography>
							<Typography variant="h4" fontWeight="bold" color="success.main">
								${tableStats.validTotalAmount.toLocaleString()}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								含稅總金額
							</Typography>
						</Box>

						{/* 發票總稅額 */}
						<Box>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								發票總稅額
							</Typography>
							<Typography variant="h4" fontWeight="bold" color="warning.main">
								${tableStats.validTotalTax.toLocaleString()}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								稅額合計
							</Typography>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setStatsDialogOpen(false)}>關閉</Button>
				</DialogActions>
			</Dialog>

			{/* 列印貼紙對話框 */}
			{printDialogOpen && <CompanyLabelsPrint companyIds={companyIdsForPrint} />}

			{/* 查看發票詳情對話框 */}
			<Dialog
				open={viewDialogOpen}
				onClose={() => setViewDialogOpen(false)}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						minHeight: '70vh',
						maxHeight: '90vh',
					},
				}}
			>
				<DialogTitle>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="h6">發票詳情</Typography>
						{viewingInvoice && getStatusChip(viewingInvoice.status)}
					</Stack>
				</DialogTitle>
				<DialogContent dividers>
					{viewingInvoice && (
						<Stack spacing={3}>
							{/* 基本資訊 */}
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									基本資訊
								</Typography>
								<Stack spacing={1.5}>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											發票號碼:
										</Typography>
										<Typography variant="body2" fontWeight="medium">
											{viewingInvoice.invoiceNumber}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											開立日期:
										</Typography>
										<Typography variant="body2">
											{new Date(viewingInvoice.date).toLocaleDateString('zh-TW')}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											客戶名稱:
										</Typography>
										<Typography variant="body2">{viewingInvoice.companyName}</Typography>
									</Stack>
									{viewingInvoice.notes && (
										<Stack direction="row" spacing={2}>
											<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
												備註:
											</Typography>
											<Typography variant="body2">{viewingInvoice.notes}</Typography>
										</Stack>
									)}
								</Stack>
							</Box>

							{/* 金額資訊 */}
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									金額資訊
								</Typography>
								<Stack spacing={1.5}>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											小計:
										</Typography>
										<Typography variant="body2">
											${viewingInvoice.subtotal.toLocaleString()}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											稅率:
										</Typography>
										<Typography variant="body2">{viewingInvoice.taxRate}%</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											稅額:
										</Typography>
										<Typography variant="body2">${viewingInvoice.tax.toLocaleString()}</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											總計:
										</Typography>
										<Typography variant="body2" fontWeight="bold" fontSize="1.1rem">
											${viewingInvoice.total.toLocaleString()}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											額外費用含稅:
										</Typography>
										<Typography variant="body2">
											{viewingInvoice.extraExpensesIncludeTax ? '是' : '否'}
										</Typography>
									</Stack>
								</Stack>
							</Box>

							{/* 付款資訊 */}
							{viewingInvoice.status === 'paid' && (
								<Box>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										付款資訊
									</Typography>
									<Stack spacing={1.5}>
										{viewingInvoice.paymentMethod && (
											<Stack direction="row" spacing={2}>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ minWidth: 100 }}
												>
													付款方式:
												</Typography>
												<Typography variant="body2">{viewingInvoice.paymentMethod}</Typography>
											</Stack>
										)}
										{viewingInvoice.paidAt && (
											<Stack direction="row" spacing={2}>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ minWidth: 100 }}
												>
													收款時間:
												</Typography>
												<Typography variant="body2">
													{new Date(viewingInvoice.paidAt).toLocaleString('zh-TW')}
												</Typography>
											</Stack>
										)}
										{viewingInvoice.paymentNote && (
											<Stack direction="row" spacing={2}>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ minWidth: 100 }}
												>
													付款備註:
												</Typography>
												<Typography variant="body2">{viewingInvoice.paymentNote}</Typography>
											</Stack>
										)}
									</Stack>
								</Box>
							)}

							{/* 託運單列表 */}
							{viewingInvoice.waybills && viewingInvoice.waybills.length > 0 && (
								<Box>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										託運單明細 ({viewingInvoice.waybills.length} 筆)
									</Typography>
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>
												<TableRow>
													<StyledTableCell>日期</StyledTableCell>
													<StyledTableCell>品項</StyledTableCell>
													<StyledTableCell>司機</StyledTableCell>
													<StyledTableCell align="right">金額</StyledTableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{viewingInvoice.waybills
													.sort(
														(a, b) =>
															new Date(a.date).getTime() - new Date(b.date).getTime(),
													)
													.map((waybill) => (
														<TableRow key={waybill.waybillId}>
															<TableCell>
																{new Date(waybill.date).toLocaleDateString('zh-TW')}
															</TableCell>
															<TableCell>{waybill.item}</TableCell>
															<TableCell>{waybill.driverName}</TableCell>
															<TableCell align="right">
																${waybill.fee.toLocaleString()}
															</TableCell>
														</TableRow>
													))}
												<TableRow>
													<TableCell colSpan={3} align="right">
														<Typography variant="body2" fontWeight="bold">
															託運單小計:
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" fontWeight="bold">
															$
															{viewingInvoice.waybills
																.reduce((sum, w) => sum + w.fee, 0)
																.toLocaleString()}
														</Typography>
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</TableContainer>
								</Box>
							)}

							{/* 額外費用列表 */}
							{viewingInvoice.extraExpenses && viewingInvoice.extraExpenses.length > 0 && (
								<Box>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										額外費用明細 ({viewingInvoice.extraExpenses.length} 筆)
									</Typography>
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>
												<TableRow>
													<StyledTableCell>項目</StyledTableCell>
													<StyledTableCell>備註</StyledTableCell>
													<StyledTableCell align="right">金額</StyledTableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{viewingInvoice.extraExpenses.map((expense) => (
													<TableRow key={expense.extraExpenseId}>
														<TableCell>{expense.item}</TableCell>
														<TableCell>{expense.notes || '-'}</TableCell>
														<TableCell align="right">
															${expense.fee.toLocaleString()}
														</TableCell>
													</TableRow>
												))}
												<TableRow>
													<TableCell colSpan={2} align="right">
														<Typography variant="body2" fontWeight="bold">
															額外費用小計:
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" fontWeight="bold">
															$
															{viewingInvoice.extraExpenses
																.reduce((sum, e) => sum + e.fee, 0)
																.toLocaleString()}
														</Typography>
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</TableContainer>
								</Box>
							)}

							{/* 時間資訊 */}
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									時間資訊
								</Typography>
								<Stack spacing={1.5}>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											建立時間:
										</Typography>
										<Typography variant="body2">
											{new Date(viewingInvoice.createdAt).toLocaleString('zh-TW')}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
											更新時間:
										</Typography>
										<Typography variant="body2">
											{new Date(viewingInvoice.updatedAt).toLocaleString('zh-TW')}
										</Typography>
									</Stack>
								</Stack>
							</Box>
						</Stack>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setViewDialogOpen(false)}>關閉</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
