import React, { useMemo, useState, useCallback } from 'react';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
	Menu,
	MenuItem,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControl,
	InputLabel,
	Select,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import { Controller, useForm } from 'react-hook-form';

import { Waybill } from '../../../Waybill/types/waybill.types';
import { useVoidInvoiceMutation, useMarkInvoicePaidMutation, useDeleteInvoiceMutation } from '../../api/mutation';
import { useInvoiceTable } from '../../hooks/useInvoiceTable';
import { Invoice, MarkInvoicePaidRequest } from '../../types/invoice.type';
import InvoicedWaybillSubTable from '../InvoiceWaybillSubTable/InvoiceWaybillSubTable';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface InvoicedTableProps {
	invoices: Invoice[];
	waybills: Waybill[];
	onEdit?: (invoice: Invoice) => void;
}

export function InvoicedTable({ invoices, waybills, onEdit }: InvoicedTableProps) {
	// waybill map for invoice details
	const waybillMap = useMemo(() => {
		const map: Record<string, Waybill> = {};
		waybills.forEach((b) => {
			if (b.id) map[b.id] = b;
		});
		return map;
	}, [waybills]);

	const voidMutation = useVoidInvoiceMutation();
	const markPaidMutation = useMarkInvoicePaidMutation();
	const deleteMutation = useDeleteInvoiceMutation();

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

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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

	// 處理操作選單開啟
	const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
		setAnchorEl(event.currentTarget);
		setSelectedInvoice(invoice);
	}, []);

	// 處理操作選單關閉
	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedInvoice(null);
	};

	// 處理作廢發票
	const handleVoidInvoice = () => {
		if (selectedInvoice) {
			voidMutation.mutate(selectedInvoice.id);
		}
		handleMenuClose();
	};

	// 處理刪除發票
	const handleDeleteInvoice = () => {
		if (selectedInvoice) {
			deleteMutation.mutate(selectedInvoice.id);
		}
		handleMenuClose();
	};

	// 處理標記收款
	const handleMarkPaid = () => {
		setPaymentDialogOpen(true);
		handleMenuClose();
	};

	// 處理收款表單提交
	const onPaymentSubmit = (data: MarkInvoicePaidRequest) => {
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
	};

	// 處理編輯發票
	const handleEditInvoice = () => {
		if (selectedInvoice && onEdit) {
			onEdit(selectedInvoice);
		}
		handleMenuClose();
	};

	// 狀態顏色和文本的對照
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
				return (
					<IconButton size="small" onClick={(e) => handleMenuOpen(e, row.original)}>
						<MoreVertIcon />
					</IconButton>
				);
			}

			if (cell.column.id === 'status') {
				return getStatusChip(row.original.status);
			}

			return flexRender(cell.column.columnDef.cell, cell.getContext());
		},
		[handleMenuOpen, getStatusChip],
	);

	const { table } = useInvoiceTable({
		data: invoices,
		onVoidInvoice: (invoiceId) => voidMutation.mutate(invoiceId),
		onEditInvoice: onEdit,
		onMarkPaid: (invoiceId) => {
			// 這個 handler 不會被直接調用，實際的收款處理由 menu 操作處理
		},
		onDeleteInvoice: (invoiceId) => deleteMutation.mutate(invoiceId),
	});

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
				<Table stickyHeader>
					<TableHead>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<StyledTableCell key={header.id} size="small">
										{renderHeaderContent(header)}
									</StyledTableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<React.Fragment key={row.id}>
								<StyledTableRow>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} size="small">
											{renderCellContent(cell, row)}
										</TableCell>
									))}
								</StyledTableRow>
								{row.getIsExpanded() && (
									<TableRow>
										<TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
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

			{/* 操作選單 */}
			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
				{selectedInvoice?.status === 'issued' && <MenuItem onClick={handleMarkPaid}>標記為已收款</MenuItem>}
				{selectedInvoice?.status === 'issued' && onEdit && (
					<MenuItem onClick={handleEditInvoice}>編輯發票</MenuItem>
				)}
				{(selectedInvoice?.status === 'issued' || selectedInvoice?.status === 'paid') && (
					<MenuItem onClick={handleVoidInvoice}>作廢發票</MenuItem>
				)}
				{selectedInvoice?.status === 'issued' && <MenuItem onClick={handleDeleteInvoice}>刪除發票</MenuItem>}
			</Menu>

			{/* 收款對話框 */}
			<Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
				<form onSubmit={handlePaymentSubmit(onPaymentSubmit)}>
					<DialogTitle>標記發票收款</DialogTitle>
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
