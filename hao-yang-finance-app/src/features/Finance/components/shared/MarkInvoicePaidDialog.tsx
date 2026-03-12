import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
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
import { Controller, useForm } from 'react-hook-form';

import { useMarkInvoicePaidMutation, useResolveOutstandingBalanceMutation } from '../../api/mutation';
import { useOutstandingBalancesByCompanyQuery } from '../../api/query';
import { Invoice, MarkInvoicePaidRequest } from '../../types/invoice.type';

const PAYMENT_METHODS = ['現金', '轉帳', '支票', '信用卡', '其他'] as const;

interface MarkInvoicePaidDialogProps {
	open: boolean;
	invoice: Invoice | null;
	onClose: () => void;
}

export function MarkInvoicePaidDialog({ open, invoice, onClose }: MarkInvoicePaidDialogProps) {
	const markPaidMutation = useMarkInvoicePaidMutation();
	const resolveMutation = useResolveOutstandingBalanceMutation();
	const { data: outstandingByCompany = [] } = useOutstandingBalancesByCompanyQuery();

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<MarkInvoicePaidRequest>({
		defaultValues: {
			paymentMethod: '',
			paymentNote: '',
			outstandingAmount: undefined,
			outstandingNote: '',
		},
	});

	const outstandingAmountValue = watch('outstandingAmount');

	const onSubmit = (data: MarkInvoicePaidRequest) => {
		if (invoice) {
			markPaidMutation.mutate(
				{ id: invoice.id, data },
				{
					onSuccess: () => {
						onClose();
						reset();
					},
				},
			);
		}
	};

	const companyRecords = invoice
		? outstandingByCompany.find((c) => c.companyId === invoice.companyId)
		: null;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>標記發票收款</DialogTitle>
			<form onSubmit={handleSubmit(onSubmit)}>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						{invoice && (
							<Box>
								<Typography variant="body2" color="text.secondary">
									發票號碼: {invoice.invoiceNumber}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									金額: ${invoice.total.toLocaleString()}
								</Typography>
							</Box>
						)}

						<Controller
							name="paymentMethod"
							control={control}
							rules={{ required: '請選擇付款方式' }}
							render={({ field }) => (
								<FormControl fullWidth error={!!errors.paymentMethod}>
									<InputLabel>付款方式</InputLabel>
									<Select {...field} label="付款方式">
										{PAYMENT_METHODS.map((method) => (
											<MenuItem key={method} value={method}>
												{method}
											</MenuItem>
										))}
									</Select>
									{errors.paymentMethod && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
											{errors.paymentMethod.message}
										</Typography>
									)}
								</FormControl>
							)}
						/>

						<Controller
							name="paymentNote"
							control={control}
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

						{/* 該公司歷史欠款記錄 */}
						{companyRecords && companyRecords.records.length > 0 && (
							<Box>
								<Typography variant="subtitle2" color="error" gutterBottom>
									此公司歷史欠款（{companyRecords.records.length} 筆，共 $
									{companyRecords.totalOutstanding.toLocaleString()}）
								</Typography>
								<TableContainer component={Paper} variant="outlined">
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell>來源發票</TableCell>
												<TableCell align="right">金額</TableCell>
												<TableCell>備註</TableCell>
												<TableCell align="center" sx={{ width: 80 }}>
													操作
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{companyRecords.records.map((record) => (
												<TableRow key={record.id}>
													<TableCell>{record.invoiceNumber}</TableCell>
													<TableCell align="right">
														<Typography variant="body2" color="error" fontWeight="bold">
															${record.amount.toLocaleString()}
														</Typography>
													</TableCell>
													<TableCell>{record.note || '-'}</TableCell>
													<TableCell align="center">
														<Button
															size="small"
															variant="contained"
															color="success"
															disabled={resolveMutation.isPending}
															onClick={() => resolveMutation.mutate(record.id)}
														>
															已補齊
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Box>
						)}

						{/* 欠款記錄（選填） */}
						<Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
							欠款記錄（選填）
						</Typography>

						<Controller
							name="outstandingAmount"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									value={field.value ?? ''}
									onChange={(e) => {
										const val = e.target.value;
										field.onChange(val === '' ? undefined : Number(val));
									}}
									label="欠款金額"
									fullWidth
									type="number"
									inputProps={{ min: 0 }}
									placeholder="如有欠款請填寫金額"
								/>
							)}
						/>

						{outstandingAmountValue != null && outstandingAmountValue > 0 && (
							<Controller
								name="outstandingNote"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="欠款備註"
										fullWidth
										multiline
										rows={2}
										placeholder="例如：客戶少匯、下月補齊..."
									/>
								)}
							/>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>取消</Button>
					<Button type="submit" variant="contained" disabled={markPaidMutation.isPending}>
						確認收款
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
