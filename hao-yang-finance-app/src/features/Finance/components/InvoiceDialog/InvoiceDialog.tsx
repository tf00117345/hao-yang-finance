import { useEffect, useState } from 'react';

import {
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import { useCompaniesQuery } from '../../../Settings/api/query';
import { Company } from '../../../Settings/types/company';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useCreateInvoiceMutation, useUpdateInvoiceMutation } from '../../api/mutation';
import { CreateInvoiceRequest, Invoice } from '../../types/invoice.type';

interface InvoiceDialogProps {
	open: boolean;
	onClose: () => void;
	waybillList: Waybill[];
	editingInvoice?: Invoice;
	onSuccess?: () => void;
}

export function InvoiceDialog({ open, onClose, waybillList, editingInvoice, onSuccess }: InvoiceDialogProps) {
	const createMutation = useCreateInvoiceMutation();
	const updateMutation = useUpdateInvoiceMutation();
	const { data: companies = [] } = useCompaniesQuery();

	const [selectedExtraExpenses, setSelectedExtraExpenses] = useState<string[]>([]);

	const {
		control,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<CreateInvoiceRequest>({
		defaultValues: {
			invoiceNumber: '',
			date: format(new Date(), 'yyyy-MM-dd'),
			companyId: '',
			taxRate: 0.05,
			extraExpensesIncludeTax: false,
			notes: '',
			waybillIds: [],
			extraExpenseIds: [],
		},
	});

	const watchedValues = watch();

	// 初始化表單資料
	useEffect(() => {
		if (open) {
			if (editingInvoice) {
				// 編輯模式
				reset({
					invoiceNumber: editingInvoice.invoiceNumber,
					date: editingInvoice.date,
					companyId: editingInvoice.companyId,
					taxRate: editingInvoice.taxRate,
					extraExpensesIncludeTax: editingInvoice.extraExpensesIncludeTax,
					notes: editingInvoice.notes || '',
					waybillIds: editingInvoice.waybills.map((w) => w.waybillId),
					extraExpenseIds: editingInvoice.extraExpenses.map((e) => e.extraExpenseId),
				});
				setSelectedExtraExpenses(editingInvoice.extraExpenses.map((e) => e.extraExpenseId));
			} else {
				// 新增模式
				const waybillIds = waybillList.map((w) => w.id).filter(Boolean) as string[];
				const firstWaybill = waybillList[0];

				// 預設選擇第一個託運單的公司
				let defaultCompanyId = '';
				if (firstWaybill?.companyId) {
					defaultCompanyId = firstWaybill.companyId;
				} else if (firstWaybill?.companyName && companies.length > 0) {
					const found = companies.find((c) => c.name === firstWaybill.companyName);
					if (found) defaultCompanyId = found.id;
				}

				// 收集所有額外費用ID並預設全選
				const allExtraExpenseIds: string[] = [];
				waybillList.forEach((waybill) => {
					if (waybill.extraExpenses) {
						waybill.extraExpenses.forEach((expense) => {
							if (expense.id) allExtraExpenseIds.push(expense.id);
						});
					}
				});

				reset({
					invoiceNumber: '',
					date: format(new Date(), 'yyyy-MM-dd'),
					companyId: defaultCompanyId,
					taxRate: 0.05,
					extraExpensesIncludeTax: false,
					notes: '',
					waybillIds,
					extraExpenseIds: allExtraExpenseIds,
				});
				setSelectedExtraExpenses(allExtraExpenseIds);
			}
		} else {
			// 重置表單
			reset({
				invoiceNumber: '',
				date: format(new Date(), 'yyyy-MM-dd'),
				companyId: '',
				taxRate: 0.05,
				extraExpensesIncludeTax: false,
				notes: '',
				waybillIds: [],
				extraExpenseIds: [],
			});
			setSelectedExtraExpenses([]);
		}
	}, [open, editingInvoice, waybillList, companies, reset]);

	// 處理對話框關閉
	const handleClose = () => {
		onClose();
	};

	// 處理表單提交
	const onSubmit = (data: CreateInvoiceRequest) => {
		// 更新選中的額外費用ID
		const baseData = {
			...data,
			extraExpenseIds: selectedExtraExpenses,
		};

		if (editingInvoice) {
			// 編輯模式：使用 UpdateInvoiceRequest 格式
			const updateData = {
				invoiceNumber: baseData.invoiceNumber,
				date: baseData.date,
				taxRate: baseData.taxRate,
				extraExpensesIncludeTax: baseData.extraExpensesIncludeTax,
				notes: baseData.notes,
				waybillIds: baseData.waybillIds,
				extraExpenseIds: baseData.extraExpenseIds,
			};

			updateMutation.mutate(
				{ id: editingInvoice.id, data: updateData },
				{
					onSuccess: () => {
						handleClose();
						onSuccess?.();
					},
				},
			);
		} else {
			// 新增模式：使用 CreateInvoiceRequest 格式
			createMutation.mutate(baseData, {
				onSuccess: () => {
					handleClose();
					onSuccess?.();
				},
			});
		}
	};

	// 獲取選中的公司詳細資料
	const getSelectedCompanyDetails = (): Company | undefined => {
		return companies.find((company) => company.id === watchedValues.companyId);
	};

	// 計算金額
	const calculateAmounts = () => {
		const waybillAmount = waybillList.reduce((sum, waybill) => sum + (waybill.fee || 0), 0);
		const extraExpenseAmount = waybillList.reduce((sum, waybill) => {
			if (!waybill.extraExpenses) return sum;
			return (
				sum +
				waybill.extraExpenses
					.filter((expense) => selectedExtraExpenses.includes(expense.id || ''))
					.reduce((expenseSum, expense) => expenseSum + expense.fee, 0)
			);
		}, 0);

		let subtotal: number;
		let tax: number;
		let total: number;

		if (watchedValues.extraExpensesIncludeTax) {
			// 額外費用包含稅率：稅額 = (託運單金額 + 額外費用) × 稅率
			subtotal = waybillAmount + extraExpenseAmount;
			tax = subtotal * watchedValues.taxRate;
			total = subtotal + tax;
		} else {
			// 額外費用不包含稅率：稅額 = 託運單金額 × 稅率
			subtotal = waybillAmount + extraExpenseAmount;
			tax = waybillAmount * watchedValues.taxRate;
			total = subtotal + tax;
		}

		return { waybillAmount, extraExpenseAmount, subtotal, tax, total };
	};

	const { waybillAmount, extraExpenseAmount, subtotal, tax, total } = calculateAmounts();

	// 處理額外費用選擇變更
	const handleExtraExpenseToggle = (expenseId: string, checked: boolean) => {
		setSelectedExtraExpenses((prev) => {
			if (checked) {
				return [...prev, expenseId];
			}
			return prev.filter((id) => id !== expenseId);
		});
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
			<form onSubmit={handleSubmit(onSubmit)}>
				<DialogTitle>{editingInvoice ? '編輯發票' : '開立發票'}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={3}>
						{/* 基本資訊 */}
						<Stack direction="row" spacing={2}>
							<Controller
								name="invoiceNumber"
								control={control}
								rules={{ required: '發票號碼為必填' }}
								render={({ field }) => (
									<TextField
										{...field}
										label="發票號碼"
										fullWidth
										error={!!errors.invoiceNumber}
										helperText={errors.invoiceNumber?.message}
									/>
								)}
							/>
							<Controller
								name="date"
								control={control}
								rules={{ required: '發票日期為必填' }}
								render={({ field }) => (
									<TextField
										{...field}
										label="發票日期"
										type="date"
										fullWidth
										InputLabelProps={{ shrink: true }}
										error={!!errors.date}
										helperText={errors.date?.message}
									/>
								)}
							/>
						</Stack>

						{/* 公司選擇 */}
						<Controller
							name="companyId"
							control={control}
							rules={{ required: '請選擇公司' }}
							render={({ field }) => (
								<FormControl fullWidth error={!!errors.companyId}>
									<InputLabel>選擇公司</InputLabel>
									<Select {...field} label="選擇公司" disabled={!!editingInvoice}>
										{companies.map((company) => (
											<MenuItem key={company.id} value={company.id}>
												{company.name} ({company.taxId})
											</MenuItem>
										))}
									</Select>
									{editingInvoice && (
										<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
											編輯模式下無法修改公司
										</Typography>
									)}
									{errors.companyId && (
										<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
											{errors.companyId.message}
										</Typography>
									)}
								</FormControl>
							)}
						/>

						{/* 公司資訊顯示 */}
						{watchedValues.companyId && getSelectedCompanyDetails() && (
							<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: '#fafafa' }}>
								<Typography variant="subtitle2" gutterBottom>
									公司資訊
								</Typography>
								<Stack spacing={0.5}>
									<Typography variant="body2">
										統一編號: {getSelectedCompanyDetails()?.taxId}
									</Typography>
									<Typography variant="body2">
										地址: {getSelectedCompanyDetails()?.address}
									</Typography>
									<Typography variant="body2">
										電話: {getSelectedCompanyDetails()?.phone?.join(', ')}
									</Typography>
								</Stack>
							</Box>
						)}

						{/* 稅率設定 */}
						<Stack direction="row" spacing={2} alignItems="center">
							<Controller
								name="taxRate"
								control={control}
								rules={{
									required: '稅率為必填',
									min: { value: 0, message: '稅率不可小於0' },
									max: { value: 1, message: '稅率不可大於1' },
								}}
								render={({ field }) => (
									<TextField
										{...field}
										label="稅率"
										type="number"
										inputProps={{ min: 0, max: 1, step: 0.01 }}
										error={!!errors.taxRate}
										helperText={errors.taxRate?.message || '預設 0.05 (5%)'}
										sx={{ width: 200 }}
									/>
								)}
							/>
							<Controller
								name="extraExpensesIncludeTax"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={<Switch checked={field.value} onChange={field.onChange} />}
										label="額外費用包含稅率"
									/>
								)}
							/>
						</Stack>

						{/* 備註 */}
						<Controller
							name="notes"
							control={control}
							render={({ field }) => <TextField {...field} label="備註" fullWidth multiline rows={2} />}
						/>

						<Divider />

						{/* 金額計算顯示 */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
							<Typography variant="subtitle2" gutterBottom>
								發票金額計算
							</Typography>
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">託運單金額:</Typography>
									<Typography variant="body2">${waybillAmount.toLocaleString()}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">額外費用:</Typography>
									<Typography variant="body2">${extraExpenseAmount.toLocaleString()}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">小計:</Typography>
									<Typography variant="body2">${subtotal.toLocaleString()}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">
										稅額 ({(watchedValues.taxRate * 100).toFixed(1)}%):
									</Typography>
									<Typography variant="body2">${tax.toLocaleString()}</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${total.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						{/* 託運單列表 */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
							<Typography variant="subtitle2" gutterBottom>
								選中的託運單 ({waybillList.length})
							</Typography>
							<TableContainer sx={{ maxHeight: 300 }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>公司名稱</TableCell>
											<TableCell>日期</TableCell>
											<TableCell>品項</TableCell>
											<TableCell>司機</TableCell>
											<TableCell align="right">費用</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{waybillList.map((waybill) => (
											<TableRow key={waybill.id}>
												<TableCell>{waybill.companyName}</TableCell>
												<TableCell>{waybill.date}</TableCell>
												<TableCell>{waybill.item}</TableCell>
												<TableCell>{waybill.driverName}</TableCell>
												<TableCell align="right">${waybill.fee?.toLocaleString()}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>

						{/* 額外費用選擇 */}
						{waybillList.some((w) => w.extraExpenses && w.extraExpenses.length > 0) && (
							<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
								<Typography variant="subtitle2" gutterBottom>
									額外費用選擇
								</Typography>
								<Stack spacing={2}>
									{waybillList.map((waybill) =>
										waybill.extraExpenses && waybill.extraExpenses.length > 0 ? (
											<Box key={waybill.id}>
												<Typography variant="body2" fontWeight="medium" gutterBottom>
													{waybill.companyName} {waybill.item} 的額外費用:
												</Typography>
												<Stack direction="row" flexWrap="wrap" gap={1}>
													{waybill.extraExpenses.map((expense) => (
														<FormControlLabel
															key={expense.id}
															control={
																<Checkbox
																	checked={selectedExtraExpenses.includes(
																		expense.id || '',
																	)}
																	onChange={(e) =>
																		handleExtraExpenseToggle(
																			expense.id || '',
																			e.target.checked,
																		)
																	}
																/>
															}
															label={`${expense.item} - $${expense.fee.toLocaleString()}`}
														/>
													))}
												</Stack>
											</Box>
										) : null,
									)}
								</Stack>
							</Box>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>取消</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={createMutation.isPending || updateMutation.isPending}
					>
						{editingInvoice ? '更新發票' : '確認開立'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
