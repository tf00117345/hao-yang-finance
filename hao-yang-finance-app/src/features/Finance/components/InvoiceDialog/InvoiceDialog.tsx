import { useEffect, useMemo, useRef, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
	Autocomplete,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	IconButton,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import { useCompaniesQuery } from '../../../Settings/api/query';
import { Company } from '../../../Settings/types/company';
import {
	useCreateExtraExpenseMutation,
	useUpdateExtraExpenseMutation,
	useDeleteExtraExpenseMutation,
} from '../../../Waybill/api/mutation';
import { useSuggestedWaybillsQuery, useWaybillsByIdsQuery } from '../../../Waybill/api/query';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useCreateInvoiceMutation, useUpdateInvoiceMutation } from '../../api/mutation';
import { useInvoicesQuery, useLastInvoiceNumberQuery } from '../../api/query';
import { CreateInvoiceRequest, Invoice } from '../../types/invoice.type';

// 定義一個常量空數組，避免每次都創建新的物件引用
const EMPTY_WAYBILLS: Waybill[] = [];

interface InvoiceDialogProps {
	open: boolean;
	onClose: () => void;
	waybillList: Waybill[];
	editingInvoice?: Invoice;
	onSuccess?: () => void;
}

type ExpenseRowProps = {
	mode: 'view' | 'edit';
	expense?: { id?: string; item: string; fee: number; notes?: string };
	checked?: boolean;
	disabled?: boolean;
	onToggle?: () => void;
	onEditStart?: () => void;
	onDelete?: () => void;
	onSave?: (input: { item: string; fee: number; notes?: string }) => void;
	onCancel?: () => void;
	saving?: boolean;
};

function ExpenseRow({
	mode,
	expense,
	checked,
	disabled,
	onToggle,
	onEditStart,
	onDelete,
	onSave,
	onCancel,
	saving,
}: ExpenseRowProps) {
	const [item, setItem] = useState(expense?.item ?? '');
	const [fee, setFee] = useState<string>(expense?.fee?.toString() ?? '');
	const [notes, setNotes] = useState(expense?.notes ?? '');

	// Reset local state when switching into edit on a different expense
	useEffect(() => {
		if (mode === 'edit') {
			setItem(expense?.item ?? '');
			setFee(expense?.fee?.toString() ?? '');
			setNotes(expense?.notes ?? '');
		}
		// Intentionally omit expense?.item/fee/notes from deps:
		// we only want to reset when entering edit on a different row,
		// not when the underlying record is refetched while the user is typing.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, expense?.id]);

	if (mode === 'view') {
		return (
			<Stack direction="row" alignItems="center" spacing={1}>
				<Checkbox checked={!!checked} onChange={onToggle} disabled={disabled} />
				<Typography sx={{ flex: 1 }}>{expense?.item}</Typography>
				<Typography sx={{ minWidth: 100, textAlign: 'right' }}>${expense?.fee?.toLocaleString()}</Typography>
				{!disabled && (
					<>
						<Tooltip title="編輯">
							<IconButton size="small" onClick={onEditStart}>
								<EditIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Tooltip title="刪除">
							<IconButton size="small" color="error" onClick={onDelete}>
								<DeleteIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</>
				)}
			</Stack>
		);
	}

	const feeNumber = Number(fee);
	const isValid = item.trim().length > 0 && fee.trim().length > 0 && !Number.isNaN(feeNumber);

	return (
		<Stack direction="row" alignItems="center" spacing={1}>
			<TextField
				size="small"
				placeholder="品項"
				value={item}
				onChange={(e) => setItem(e.target.value)}
				sx={{ flex: 1 }}
			/>
			<TextField
				size="small"
				type="number"
				placeholder="金額"
				value={fee}
				onChange={(e) => setFee(e.target.value)}
				sx={{ width: 120 }}
			/>
			<TextField
				size="small"
				placeholder="備註"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				sx={{ width: 160 }}
			/>
			<Tooltip title="儲存">
				<span>
					<IconButton
						size="small"
						color="primary"
						disabled={!isValid || saving}
						onClick={() => onSave?.({ item: item.trim(), fee: feeNumber, notes: notes || undefined })}
					>
						{saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title="取消">
				<IconButton size="small" onClick={onCancel} disabled={saving}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Tooltip>
		</Stack>
	);
}

export function InvoiceDialog({ open, onClose, waybillList, editingInvoice, onSuccess }: InvoiceDialogProps) {
	const createMutation = useCreateInvoiceMutation();
	const updateMutation = useUpdateInvoiceMutation();
	const createExtraExpenseMutation = useCreateExtraExpenseMutation();
	const updateExtraExpenseMutation = useUpdateExtraExpenseMutation();
	const deleteExtraExpenseMutation = useDeleteExtraExpenseMutation();
	const { data: companies = [] } = useCompaniesQuery();
	const { data: lastInvoiceNumber = '', refetch: refetchLastInvoiceNumber } = useLastInvoiceNumberQuery();

	// 每次開啟 Dialog 時重新獲取最後一個發票號碼
	useEffect(() => {
		if (open && !editingInvoice) {
			refetchLastInvoiceNumber();
		}
	}, [open, editingInvoice, refetchLastInvoiceNumber]);

	const [selectedExtraExpenses, setSelectedExtraExpenses] = useState<string[]>([]);
	const [selectedSuggestedIds, setSelectedSuggestedIds] = useState<string[]>([]);
	const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
	const [addingForWaybillId, setAddingForWaybillId] = useState<string | null>(null);

	// 用於追踪是否已經初始化建議託運單的選擇
	const initializedSuggestedRef = useRef<string>('');

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

	// 查詢建議的託運單（僅在新建模式下啟用）
	const { data: filteredSuggestedWaybillsData = [] } = useSuggestedWaybillsQuery(
		watchedValues.companyId,
		open && !editingInvoice,
	);

	// Subscribe to fresh waybill data so extra-expense CRUD shows up immediately.
	// Without this, create mode (which gets waybillList from a parent React-state snapshot)
	// would show stale extra expenses after add/edit/delete.
	const waybillIdsForQuery = useMemo(
		() => (waybillList || []).map((w) => w.id).filter(Boolean) as string[],
		[waybillList],
	);
	const { data: freshWaybills } = useWaybillsByIdsQuery(waybillIdsForQuery);
	const effectiveWaybillList = freshWaybills && freshWaybills.length > 0 ? freshWaybills : waybillList;

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
					invoiceNumber: lastInvoiceNumber as string,
					date: waybillList[0].date,
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
				invoiceNumber: lastInvoiceNumber as string,
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
	}, [open, editingInvoice, waybillList, companies, reset, lastInvoiceNumber]);

	// 使用當前選中的 waybill IDs（穩定的字符串標識）
	const currentWaybillIdsString = useMemo(() => {
		return effectiveWaybillList
			.map((w) => w.id)
			.filter(Boolean)
			.sort()
			.join(',');
	}, [effectiveWaybillList]);

	// 使用 useMemo 計算過濾後的建議託運單（排除已選中的託運單）
	const filteredSuggestedWaybills = useMemo(() => {
		if (filteredSuggestedWaybillsData.length === 0 || editingInvoice) {
			return EMPTY_WAYBILLS; // 使用常量空數組，避免每次都創建新的物件引用
		}
		// 排除已在當前選中列表中的託運單
		const currentWaybillIds = new Set(currentWaybillIdsString.split(',').filter(Boolean));
		return filteredSuggestedWaybillsData.filter((w) => !currentWaybillIds.has(w.id || ''));
	}, [filteredSuggestedWaybillsData, editingInvoice, currentWaybillIdsString]);

	// 只在對話框打開且 companyId 變化時初始化建議託運單的選擇
	const currentCompanyId = watchedValues.companyId;
	useEffect(() => {
		if (!open || editingInvoice) {
			// 對話框關閉或編輯模式，重置
			initializedSuggestedRef.current = '';
			setSelectedSuggestedIds([]);
			return;
		}

		// 只在 companyId 變化時初始化
		if (currentCompanyId && initializedSuggestedRef.current !== currentCompanyId) {
			initializedSuggestedRef.current = currentCompanyId;
			// 默認全選建議的託運單
			if (filteredSuggestedWaybills.length > 0) {
				setSelectedSuggestedIds(filteredSuggestedWaybills.map((w) => w.id).filter(Boolean) as string[]);
			}
		}
	}, [open, editingInvoice, currentCompanyId, filteredSuggestedWaybills]);

	// 處理對話框關閉
	const handleClose = () => {
		onClose();
	};

	// 處理表單提交
	const onSubmit = (data: CreateInvoiceRequest) => {
		// 合併當前選中的託運單和建議的託運單
		const allWaybillIds = [...data.waybillIds, ...selectedSuggestedIds];

		// 更新選中的額外費用ID
		const baseData = {
			...data,
			waybillIds: allWaybillIds,
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
			// 新增模式：使用 CreateInvoiceRequest 格式，帶上系統當時顯示的建議號供後端稽核比對
			createMutation.mutate(
				{ ...baseData, suggestedInvoiceNumber: (lastInvoiceNumber as string) || undefined },
				{
					onSuccess: () => {
						handleClose();
						onSuccess?.();
					},
				},
			);
		}
	};

	// 獲取選中的公司詳細資料
	const getSelectedCompanyDetails = (): Company | undefined => {
		return companies.find((company) => company.id === watchedValues.companyId);
	};

	// 取此公司全部發票（僅在 dialog 開啟且已選公司時啟用），前端切分為已收款/未收款
	const selectedCompanyId = watchedValues.companyId;
	const { data: companyInvoices = [] } = useInvoicesQuery(
		{ companyId: selectedCompanyId },
		open && !!selectedCompanyId,
	);

	// 功能1：此公司最近一張已收款發票（依 paidAt 由新到舊）
	const lastPaidInvoice = useMemo(() => {
		return companyInvoices
			.filter((inv) => inv.status === 'paid' && inv.paidAt)
			.sort((a, b) => (b.paidAt! > a.paidAt! ? 1 : -1))[0];
	}, [companyInvoices]);

	// 功能2：此公司未付款（未收款）發票，排除編輯中的當前發票
	const unpaidInvoices = useMemo(() => {
		return companyInvoices.filter((inv) => inv.status === 'issued' && inv.id !== editingInvoice?.id);
	}, [companyInvoices, editingInvoice?.id]);

	// 計算金額（單一 useMemo 計算發票區、額外費用區、總計）
	const amounts = useMemo(() => {
		// === 發票金額計算區 ===
		const currentWaybillAmount = effectiveWaybillList.reduce((sum, w) => sum + (w.fee || 0), 0);
		const suggestedWaybillAmount = filteredSuggestedWaybills
			.filter((w) => selectedSuggestedIds.includes(w.id || ''))
			.reduce((sum, w) => sum + (w.fee || 0), 0);
		const waybillAmount = currentWaybillAmount + suggestedWaybillAmount;
		const waybillTax = Math.round(waybillAmount * watchedValues.taxRate);
		const waybillTotal = waybillAmount + waybillTax;

		// === 額外費用計算區（只計入勾選的）===
		const extraExpenseAmount = effectiveWaybillList.reduce((sum, w) => {
			if (!w.extraExpenses) return sum;
			return (
				sum +
				w.extraExpenses.filter((e) => selectedExtraExpenses.includes(e.id || '')).reduce((s, e) => s + e.fee, 0)
			);
		}, 0);
		const extraExpenseTax = watchedValues.extraExpensesIncludeTax
			? Math.round(extraExpenseAmount * watchedValues.taxRate)
			: 0;
		const extraExpenseTotal = extraExpenseAmount + extraExpenseTax;

		// === 總金額總計 ===
		const grandTotal = waybillTotal + extraExpenseTotal;

		return {
			waybillAmount,
			waybillTax,
			waybillTotal,
			extraExpenseAmount,
			extraExpenseTax,
			extraExpenseTotal,
			grandTotal,
		};
	}, [
		effectiveWaybillList,
		filteredSuggestedWaybills,
		selectedSuggestedIds,
		selectedExtraExpenses,
		watchedValues.taxRate,
		watchedValues.extraExpensesIncludeTax,
	]);

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
		<Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth keepMounted={false}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<DialogTitle>{editingInvoice ? '編輯發票' : '開立發票'}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={3}>
						{/* 基本資訊 */}
						<Stack direction="row" spacing={2}>
							<Controller
								name="invoiceNumber"
								control={control}
								rules={{
									required: '發票號碼為必填',
									pattern: {
										value: /^[A-Z]{2}\d{8}$/,
										message: '格式需為兩個英文字母加八位數字，例如 AB12345678',
									},
								}}
								render={({ field }) => (
									<TextField
										{...field}
										label="發票號碼"
										fullWidth
										inputProps={{ maxLength: 10 }}
										onChange={(e) => {
											const upper = e.target.value.toUpperCase();
											field.onChange(upper);
										}}
										error={!!errors.invoiceNumber}
										helperText={
											errors.invoiceNumber?.message ||
											'格式：兩個英文字後面八個數字，例如 AB12345678'
										}
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
										onKeyDown={(e) => e.preventDefault()}
									/>
								)}
							/>
						</Stack>

						{/* 公司選擇 */}
						<Controller
							name="companyId"
							control={control}
							rules={{ required: '請選擇公司' }}
							render={({ field: { onChange, value, ...field } }) => (
								<Autocomplete
									{...field}
									options={companies}
									getOptionLabel={(option) =>
										typeof option === 'string'
											? companies.find((c) => c.id === option)?.name || ''
											: `${option.name} (${option.taxId})`
									}
									getOptionKey={(option) => option.id}
									value={companies.find((c) => c.id === value) || null}
									onChange={(_, data) => onChange(data?.id || '')}
									disabled={!!editingInvoice}
									renderInput={(params) => (
										<TextField
											{...params}
											label="選擇公司"
											error={!!errors.companyId}
											helperText={
												editingInvoice
													? '編輯模式下無法修改公司，若開錯公司，請刪除後重新開立'
													: errors.companyId?.message
											}
											placeholder="輸入公司名稱或統編搜尋..."
										/>
									)}
									filterOptions={(options, { inputValue }) => {
										const searchText = inputValue.toLowerCase();
										return options.filter(
											(option) =>
												option.name?.toLowerCase().includes(searchText) ||
												option.taxId?.includes(searchText),
										);
									}}
									isOptionEqualToValue={(option, val) => option.id === val.id}
								/>
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
									<Typography variant="body2">
										最後付款方式:{' '}
										{lastPaidInvoice?.paymentMethod
											? `${lastPaidInvoice.paymentMethod}（${format(
													new Date(lastPaidInvoice.paidAt!),
													'yyyy-MM-dd',
												)}）`
											: '無紀錄'}
									</Typography>
								</Stack>
							</Box>
						)}

						{/* 此公司未付款發票列表 */}
						{selectedCompanyId && unpaidInvoices.length > 0 && (
							<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: '#fff8e1' }}>
								<Typography variant="subtitle2" gutterBottom>
									此公司未付款發票（{unpaidInvoices.length}）
								</Typography>
								<TableContainer sx={{ maxHeight: 240 }}>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell>發票號碼</TableCell>
												<TableCell>發票日期</TableCell>
												<TableCell align="right">發票金額</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{unpaidInvoices.map((inv) => (
												<TableRow key={inv.id}>
													<TableCell>{inv.invoiceNumber}</TableCell>
													<TableCell>{inv.date}</TableCell>
													<TableCell align="right">${inv.total.toLocaleString()}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
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
									<Typography variant="body2">${amounts.waybillAmount.toLocaleString()}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">
										稅額 ({(watchedValues.taxRate * 100).toFixed(1)}%):
									</Typography>
									<Typography variant="body2">${amounts.waybillTax.toLocaleString()}</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${amounts.waybillTotal.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						{/* 額外費用計算 */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
							<Typography variant="subtitle2" gutterBottom>
								額外費用計算
							</Typography>
							<Stack spacing={1}>
								{effectiveWaybillList.flatMap((waybill) =>
									(waybill.extraExpenses || [])
										.filter((expense) => selectedExtraExpenses.includes(expense.id || ''))
										.map((expense) => (
											<Stack
												direction="row"
												justifyContent="space-between"
												key={`calc-${expense.id}`}
											>
												<Typography variant="body2">{expense.item}:</Typography>
												<Typography
													variant="body2"
													color={expense.fee >= 0 ? 'success.main' : 'error.main'}
												>
													${expense.fee.toLocaleString()}
												</Typography>
											</Stack>
										)),
								)}
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">小計:</Typography>
									<Typography variant="body2">
										${amounts.extraExpenseAmount.toLocaleString()}
									</Typography>
								</Stack>
								{watchedValues.extraExpensesIncludeTax && (
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2">
											稅額 ({(watchedValues.taxRate * 100).toFixed(1)}%):
										</Typography>
										<Typography variant="body2">
											${amounts.extraExpenseTax.toLocaleString()}
										</Typography>
									</Stack>
								)}
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計:</Typography>
									<Typography variant="h6" color="primary">
										${amounts.extraExpenseTotal.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						{/* 總金額總計 */}
						<Box
							sx={{
								border: '2px solid',
								borderColor: 'primary.main',
								p: 2,
								borderRadius: 1,
								bgcolor: '#e3f2fd',
							}}
						>
							<Typography variant="subtitle2" gutterBottom>
								總金額總計
							</Typography>
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">發票區總計:</Typography>
									<Typography variant="body2">${amounts.waybillTotal.toLocaleString()}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">額外費用區總計:</Typography>
									<Typography variant="body2">
										${amounts.extraExpenseTotal.toLocaleString()}
									</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h5">總金額總計:</Typography>
									<Typography variant="h5" color="primary" fontWeight="bold">
										${amounts.grandTotal.toLocaleString()}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						{/* 託運單列表 */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
							<Typography variant="subtitle2" gutterBottom>
								選中的託運單 ({effectiveWaybillList.length})
							</Typography>
							<TableContainer sx={{ maxHeight: 300 }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>公司名稱</TableCell>
											<TableCell>日期</TableCell>
											<TableCell>地點</TableCell>
											<TableCell>司機</TableCell>
											<TableCell align="right">費用</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{effectiveWaybillList.map((waybill) => {
											const locations = (waybill.loadingLocations || []).filter(
												(loc) => loc.from !== '空白' && loc.to !== '空白',
											);
											const MAX_VISIBLE = 2;
											const visible = locations.slice(0, MAX_VISIBLE);
											const remaining = locations.length - visible.length;

											return (
												<TableRow key={waybill.id}>
													<TableCell>{waybill.companyName}</TableCell>
													<TableCell>{waybill.date}</TableCell>
													<TableCell>
														<Stack direction="row" flexWrap="wrap" gap={0.5}>
															{visible.map((loc, idx) => (
																<Chip
																	key={`-${`${loc.from}-${loc.to}-${idx}`}`}
																	label={`${loc.from} → ${loc.to}`}
																	size="small"
																	variant="outlined"
																/>
															))}
															{remaining > 0 && (
																<Tooltip
																	title={
																		<Stack sx={{ maxWidth: 360, p: 0.5 }}>
																			{locations.map((loc, idx) => (
																				<Typography
																					key={`full-${`${loc.from}-${loc.to}-${idx}`}`}
																					variant="body2"
																				>
																					{loc.from} → {loc.to}
																				</Typography>
																			))}
																		</Stack>
																	}
																	arrow
																	placement="top"
																>
																	<Chip
																		label={`+${remaining}`}
																		size="small"
																		color="primary"
																	/>
																</Tooltip>
															)}
														</Stack>
													</TableCell>
													<TableCell>{waybill.driverName}</TableCell>
													<TableCell align="right">
														${waybill.fee?.toLocaleString()}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>

						{/* 建議的託運單列表（前一年未開票） */}
						{!editingInvoice && filteredSuggestedWaybills.length > 0 && (
							<Box
								sx={{
									border: '2px solid #ff9800',
									p: 2,
									borderRadius: 1,
									bgcolor: '#fff3e0',
								}}
							>
								<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
									<Typography variant="subtitle2" color="warning.dark">
										⚠️ 發現有相關未開發票的託運單 ({filteredSuggestedWaybills.length})
									</Typography>
								</Stack>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									這些託運單屬於同一公司，建議一起開發票
								</Typography>

								<Stack direction="row" spacing={1} sx={{ mb: 1 }}>
									<Button
										size="small"
										variant="outlined"
										onClick={() => {
											const allIds = filteredSuggestedWaybills
												.map((w) => w.id)
												.filter(Boolean) as string[];
											setSelectedSuggestedIds(allIds);
										}}
									>
										全選
									</Button>
									<Button size="small" variant="outlined" onClick={() => setSelectedSuggestedIds([])}>
										取消全選
									</Button>
									<Typography variant="body2" sx={{ ml: 'auto', alignSelf: 'center' }}>
										已選: {selectedSuggestedIds.length} / {filteredSuggestedWaybills.length}
									</Typography>
								</Stack>

								<Divider sx={{ my: 1 }} />

								<TableContainer sx={{ maxHeight: 300 }}>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell padding="checkbox" />
												<TableCell>日期</TableCell>
												<TableCell>地點</TableCell>
												<TableCell>司機</TableCell>
												<TableCell align="right">費用</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{filteredSuggestedWaybills.map((waybill) => {
												const locations = (waybill.loadingLocations || []).filter(
													(loc) => loc.from !== '空白' && loc.to !== '空白',
												);
												const MAX_VISIBLE = 2;
												const visible = locations.slice(0, MAX_VISIBLE);
												const remaining = locations.length - visible.length;

												return (
													<TableRow
														key={waybill.id}
														hover
														onClick={() => {
															const waybillId = waybill.id || '';
															if (selectedSuggestedIds.includes(waybillId)) {
																setSelectedSuggestedIds((prev) =>
																	prev.filter((id) => id !== waybillId),
																);
															} else {
																setSelectedSuggestedIds((prev) => [...prev, waybillId]);
															}
														}}
														sx={{ cursor: 'pointer' }}
													>
														<TableCell padding="checkbox">
															<Checkbox
																checked={selectedSuggestedIds.includes(
																	waybill.id || '',
																)}
															/>
														</TableCell>
														<TableCell>{waybill.date}</TableCell>
														<TableCell>
															<Stack direction="row" flexWrap="wrap" gap={0.5}>
																{visible.map((loc, idx) => (
																	<Chip
																		key={`chip-${`${loc.from}-${loc.to}-${idx}`}`}
																		label={`${loc.from} → ${loc.to}`}
																		size="small"
																		variant="outlined"
																	/>
																))}
																{remaining > 0 && (
																	<Tooltip
																		title={
																			<Stack sx={{ maxWidth: 360, p: 0.5 }}>
																				{locations.map((loc, idx) => (
																					<Typography
																						key={`full-${`${loc.from}-${loc.to}-${idx}`}`}
																						variant="body2"
																					>
																						{loc.from} → {loc.to}
																					</Typography>
																				))}
																			</Stack>
																		}
																		arrow
																		placement="top"
																	>
																		<Chip
																			label={`+${remaining}`}
																			size="small"
																			color="primary"
																		/>
																	</Tooltip>
																)}
															</Stack>
														</TableCell>
														<TableCell>{waybill.driverName}</TableCell>
														<TableCell align="right">
															${waybill.fee?.toLocaleString()}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</TableContainer>
							</Box>
						)}

						{/* 額外費用 (新增/修改/刪除) */}
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
							<Typography variant="subtitle2" gutterBottom>
								額外費用
							</Typography>
							<Stack spacing={2}>
								{effectiveWaybillList.map((waybill) => {
									const isInvoiced = waybill.status === 'INVOICED';
									const expenses = waybill.extraExpenses || [];
									return (
										<Box key={waybill.id}>
											<Typography variant="body2" fontWeight="medium" gutterBottom>
												{waybill.companyName} {waybill.item} 的額外費用
												{isInvoiced && (
													<Typography
														component="span"
														variant="caption"
														color="text.secondary"
														sx={{ ml: 1 }}
													>
														(已開立發票，無法修改)
													</Typography>
												)}
												:
											</Typography>
											<Stack spacing={0.5}>
												{expenses.map((expense) => {
													const isEditing = editingExpenseId === expense.id;
													return (
														<ExpenseRow
															key={expense.id}
															mode={isEditing ? 'edit' : 'view'}
															expense={expense}
															checked={selectedExtraExpenses.includes(expense.id || '')}
															disabled={isInvoiced}
															onToggle={() =>
																handleExtraExpenseToggle(
																	expense.id || '',
																	!selectedExtraExpenses.includes(expense.id || ''),
																)
															}
															onEditStart={() => {
																setAddingForWaybillId(null);
																setEditingExpenseId(expense.id || null);
															}}
															onDelete={() => {
																if (!expense.id) return;
																deleteExtraExpenseMutation.mutate(expense.id, {
																	onSuccess: () => {
																		setSelectedExtraExpenses((prev) =>
																			prev.filter((id) => id !== expense.id),
																		);
																	},
																});
															}}
															onSave={(input) => {
																if (!expense.id) return;
																updateExtraExpenseMutation.mutate(
																	{ id: expense.id, input },
																	{
																		onSuccess: () => setEditingExpenseId(null),
																	},
																);
															}}
															onCancel={() => setEditingExpenseId(null)}
															saving={
																updateExtraExpenseMutation.isPending ||
																deleteExtraExpenseMutation.isPending
															}
														/>
													);
												})}
												{addingForWaybillId === waybill.id ? (
													<ExpenseRow
														mode="edit"
														onSave={(input) => {
															createExtraExpenseMutation.mutate(
																{ waybillId: waybill.id, input },
																{
																	onSuccess: (created) => {
																		if (created.id) {
																			setSelectedExtraExpenses((prev) => [
																				...prev,
																				created.id!,
																			]);
																		}
																		setAddingForWaybillId(null);
																	},
																},
															);
														}}
														onCancel={() => setAddingForWaybillId(null)}
														saving={createExtraExpenseMutation.isPending}
													/>
												) : (
													!isInvoiced && (
														<Button
															size="small"
															onClick={() => {
																setEditingExpenseId(null);
																setAddingForWaybillId(waybill.id);
															}}
															sx={{ alignSelf: 'flex-start' }}
														>
															+ 新增額外費用
														</Button>
													)
												)}
											</Stack>
										</Box>
									);
								})}
							</Stack>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Box sx={{ flex: 1, display: 'flex', alignItems: 'center', ml: 2 }}>
						<Typography variant="body2" color="text.secondary">
							共 {effectiveWaybillList.length + selectedSuggestedIds.length} 張託運單
						</Typography>
					</Box>
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
