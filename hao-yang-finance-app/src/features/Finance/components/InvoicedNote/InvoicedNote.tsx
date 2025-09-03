import { useCallback, useMemo, useState } from 'react';

import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
	Box,
	Button,
	Checkbox,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

import { useMarkInvoicePaidMutation, useRestoreInvoiceMutation } from '../../api/mutation';
import { Invoice, MarkInvoicePaidRequest } from '../../types/invoice.type';
import CompanyLabelsPrint from '../CompanyLabelsPrint/CompanyLabelsPrint';

interface InvoicedNoteProps {
	invoices: Invoice[];
	onEdit?: (invoice: Invoice) => void;
}

export function InvoicedNote({ invoices, onEdit }: InvoicedNoteProps) {
	const markPaidMutation = useMarkInvoicePaidMutation();
	const restoreMutation = useRestoreInvoiceMutation();

	// 對話框狀態管理
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

	// 列印貼紙對話框
	const [printDialogOpen, setPrintDialogOpen] = useState(false);
	const companyIdsForPrint = useMemo(() => {
		const ids = invoices.filter((i) => i.status === 'issued').map((i) => i.companyId);
		return Array.from(new Set(ids));
	}, [invoices]);

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

	const handleMarkPaid = useCallback((invoice: Invoice) => {
		setSelectedInvoice(invoice);
		setPaymentDialogOpen(true);
	}, []);

	/* 保留編輯能力（目前未使用），如需使用可在筆記本列中加入按鈕觸發 */
	// const handleEditInvoice = useCallback(
	// 	(invoice: Invoice) => {
	// 		if (onEdit) {
	// 			onEdit(invoice);
	// 		}
	// 	},
	// 	[onEdit],
	// );

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

	// 狀態篩選（本地）與衍生列表
	const [selectedStatuses, setSelectedStatuses] = useState<Invoice['status'][]>(['issued', 'paid']);

	function toggleStatusFilter(status: Invoice['status']) {
		setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
	}

	const filteredInvoices = useMemo(() => {
		return invoices.filter((inv) => selectedStatuses.includes(inv.status));
	}, [invoices, selectedStatuses]);

	// 額外費用加總（僅計算 isSelected=true）
	function getExtraExpenseSelectedSum(inv: Invoice): number {
		return inv.extraExpenses.filter((e) => e.isSelected).reduce((sum, e) => sum + (e.fee || 0), 0);
	}

	function getReceivable(inv: Invoice): number {
		if (inv.status === 'issued') return inv.total;
		return 0;
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		return dateStr.slice(0, 10);
	}

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
				<Stack direction="row" spacing={1}>
					<Typography sx={{ flex: '1 1 100%', px: 2 }} variant="h6" component="div">
						已開立發票清單
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
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

			{/* 記事本UI */}
			<Stack id="invoice-note-container" direction="column" sx={{ gap: 1 }}>
				{/* 狀態篩選 */}
				<Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
					<Typography variant="body2" color="text.secondary">
						狀態：
					</Typography>
					<Chip
						label="已開立"
						variant={selectedStatuses.includes('issued') ? 'filled' : 'outlined'}
						color="primary"
						onClick={() => toggleStatusFilter('issued')}
						size="small"
					/>
					<Chip
						label="已收款"
						variant={selectedStatuses.includes('paid') ? 'filled' : 'outlined'}
						color="success"
						onClick={() => toggleStatusFilter('paid')}
						size="small"
					/>
					<Chip
						label="已作廢"
						variant={selectedStatuses.includes('void') ? 'filled' : 'outlined'}
						color="default"
						onClick={() => toggleStatusFilter('void')}
						size="small"
					/>
				</Stack>

				{/* 清單 */}
				<Box
					sx={{
						border: 1,
						borderColor: 'divider',
						borderRadius: 1,
						px: 1,
						py: 0.5,
						fontFamily:
							'Roboto Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
						maxHeight: 520,
						overflowY: 'auto',
					}}
				>
					{filteredInvoices.map((inv) => {
						const extraSum = getExtraExpenseSelectedSum(inv);
						const receivable = getReceivable(inv);
						const isVoid = inv.status === 'void';
						const isPaid = inv.status === 'paid';
						return (
							<Stack
								key={inv.id}
								direction="row"
								alignItems="center"
								sx={{
									py: 0.75,
									borderBottom: '1px dashed',
									borderColor: 'divider',
									textDecoration: isVoid ? 'line-through' : 'none',
									opacity: isVoid ? 0.65 : 1,
								}}
							>
								{/* 發票號碼 */}
								<Box sx={{ width: 140, pr: 1 }}>
									<Typography variant="body2">{inv.invoiceNumber}</Typography>
								</Box>
								{/* 客戶名稱 */}
								<Box sx={{ flex: 1, pr: 1, minWidth: 160 }}>
									<Typography variant="body2" noWrap title={inv.companyName}>
										{inv.companyName}
									</Typography>
								</Box>
								{/* 開立日期 */}
								<Box sx={{ width: 112, pr: 1 }}>
									<Typography variant="body2">{formatDate(inv.date)}</Typography>
								</Box>
								{/* 額外費用金額 */}
								<Box sx={{ width: 132, pr: 1, textAlign: 'right' }}>
									<Typography variant="body2">{extraSum.toLocaleString()}</Typography>
								</Box>
								{/* 發票金額 */}
								<Box sx={{ width: 132, pr: 1, textAlign: 'right' }}>
									<Typography variant="body2">{inv.total.toLocaleString()}</Typography>
								</Box>
								{/* 應收帳款 */}
								<Box sx={{ width: 132, pr: 1, textAlign: 'right' }}>
									<Typography
										variant="body2"
										color={inv.status === 'issued' ? 'text.primary' : 'text.disabled'}
									>
										{receivable.toLocaleString()}
									</Typography>
								</Box>
								{/* 備註 */}
								<Box sx={{ flex: 1, pr: 1, minWidth: 160 }}>
									<Tooltip
										title={inv.notes || ''}
										disableHoverListener={!inv.notes}
										placement="top"
										arrow
									>
										<Typography variant="body2" noWrap>
											{inv.notes || ''}
										</Typography>
									</Tooltip>
								</Box>
								{/* 操作：checkbox 或 X */}
								<Box sx={{ width: 56, display: 'flex', justifyContent: 'flex-end' }}>
									{isVoid ? (
										<Typography variant="body2" color="error">
											X
										</Typography>
									) : (
										<Checkbox
											checked={isPaid}
											disabled={markPaidMutation.isPending || restoreMutation.isPending}
											onChange={(e) => {
												const nextChecked = e.target.checked;
												if (nextChecked) {
													// 未勾選 → 勾選：開啟收款對話框
													handleMarkPaid(inv);
												} else if (isPaid) {
													// 已勾選 → 取消勾選：直接恢復為已開立
													restoreMutation.mutate(inv.id);
												}
											}}
										/>
									)}
								</Box>
							</Stack>
						);
					})}
				</Box>
			</Stack>

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

			{/* 列印貼紙對話框 */}
			{printDialogOpen && <CompanyLabelsPrint companyIds={companyIdsForPrint} />}
		</Stack>
	);
}
