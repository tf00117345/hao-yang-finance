import React, { useState, useCallback } from 'react';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ArrowUpward, ArrowDownward, UnfoldMore, FilterList, Clear } from '@mui/icons-material';
import {
	Box,
	Button,
	Collapse,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	InputAdornment,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import { Controller, useForm } from 'react-hook-form';

import {
	useVoidInvoiceMutation,
	useMarkInvoicePaidMutation,
	useDeleteInvoiceMutation,
	useRestoreInvoiceMutation,
} from '../../api/mutation';
import { useInvoiceTable } from '../../hooks/useInvoiceTable';
import { Invoice, MarkInvoicePaidRequest } from '../../types/invoice.type';
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

	// 對話框狀態管理
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

	// 操作處理函數
	const handleVoidInvoice = useCallback(
		(invoice: Invoice) => {
			voidMutation.mutate(invoice.id);
		},
		[voidMutation],
	);

	// 恢復發票到已開立
	const handleRestoreInvoice = useCallback(
		(invoice: Invoice) => {
			restoreMutation.mutate(invoice.id);
		},
		[restoreMutation],
	);

	// 刪除發票
	const handleDeleteInvoice = useCallback(
		(invoice: Invoice) => {
			deleteMutation.mutate(invoice.id);
		},
		[deleteMutation],
	);

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

	// 狀態 Chip 組件
	const getStatusChip = useCallback((status: string) => {
		switch (status) {
			case 'issued':
				return <Chip label="已開立" color="primary" size="small" />;
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

			if (invoice.status === 'paid') {
				return (
					<Button
						size="small"
						variant="contained"
						color="success"
						onClick={() => handleRestoreInvoice(invoice)}
					>
						恢復
					</Button>
				);
			}

			if (invoice.status === 'void') {
				return (
					<Stack direction="row" spacing={1}>
						{/* <Button
							size="small"
							variant="contained"
							color="success"
							onClick={() => handleRestoreInvoice(invoice)}
						>
							恢復
						</Button> */}
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

			return null;
		},
		[handleMarkPaid, handleEditInvoice, handleVoidInvoice, handleDeleteInvoice, handleRestoreInvoice],
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

	const { table } = useInvoiceTable({
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

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Typography sx={{ px: 2, mb: 2 }} variant="h6">
				已開立發票清單
			</Typography>
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
					<TableHead>
						{/* 表頭行 */}
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<StyledTableCell
										key={header.id}
										size="small"
										onClick={header.column.getToggleSortingHandler()}
										sx={{
											position: 'relative',
											width: header.getSize(),
											minWidth: header.column.columnDef.minSize || 120,
											cursor: header.column.getCanSort() ? 'pointer' : 'default',
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
						<TableRow>
							{table.getHeaderGroups()[0].headers.map((header) => (
								<TableCell key={`filter-${header.id}`} sx={{ py: 1, px: 1 }}>
									{header.column.getCanFilter() && (
										<SmartFilterInput
											columnId={header.id}
											columnHeader={header.column.columnDef.header as string}
											value={getFilterValue(header.id)}
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
							<React.Fragment key={row.id}>
								<StyledTableRow>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											size="small"
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
		</Stack>
	);
}
