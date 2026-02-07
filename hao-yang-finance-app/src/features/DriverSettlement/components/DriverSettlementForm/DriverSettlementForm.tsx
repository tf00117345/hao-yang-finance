import { useEffect, useMemo, useRef } from 'react';

import { Add, Delete } from '@mui/icons-material';
import {
	Box,
	Button,
	CircularProgress,
	Grid,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { getDrivers } from '../../../Settings/api/api';
import { useCreateDriverSettlement, useUpdateDriverSettlement } from '../../api/mutation';
import { useDefaultExpenses, useDriverSettlementByDriverAndMonth } from '../../api/query';
import { DriverSettlement, SettlementFormData } from '../../types/driver-settlement.types';

interface DriverSettlementFormProps {
	targetMonth: Date;
	driverId: string;
	editingSettlement?: DriverSettlement | null;
	mode: 'view' | 'edit';
	onSuccess: () => void;
	onCancel: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}

function DriverSettlementForm({
	targetMonth,
	driverId,
	editingSettlement,
	mode,
	onSuccess,
	onCancel,
	onEdit,
	onDelete,
}: DriverSettlementFormProps) {
	const hasInitializedExpenses = useRef(false);

	// Queries - Load drivers first before initializing form
	const { data: drivers, isLoading: driversLoading } = useQuery({
		queryKey: ['drivers'],
		queryFn: () => getDrivers(),
	});

	// Get default profit share ratio from selected driver
	const getDefaultProfitShareRatio = () => {
		if (editingSettlement?.profitShareRatio) {
			return editingSettlement.profitShareRatio;
		}
		if (drivers && driverId) {
			const selectedDriver = drivers.find((d) => d.id === driverId);
			return selectedDriver?.profitShareRatio || 50;
		}
		return 50;
	};

	const { control, handleSubmit, watch, setValue } = useForm<SettlementFormData>({
		defaultValues: {
			driverId,
			targetMonth,
			profitShareRatio: getDefaultProfitShareRatio(),
			companyExpenses:
				editingSettlement?.expenses
					?.filter((e) => e.category === 'company')
					.map((e) => ({
						name: e.name,
						amount: e.amount,
						expenseTypeId: e.expenseTypeId,
					})) || [],
			personalExpenses:
				editingSettlement?.expenses
					?.filter((e) => e.category === 'personal')
					.map((e) => ({
						name: e.name,
						amount: e.amount,
						expenseTypeId: e.expenseTypeId,
					})) || [],
		},
	});

	const {
		fields: companyExpenseFields,
		append: appendCompanyExpense,
		remove: removeCompanyExpense,
	} = useFieldArray({
		control,
		name: 'companyExpenses',
	});

	const {
		fields: personalExpenseFields,
		append: appendPersonalExpense,
		remove: removePersonalExpense,
	} = useFieldArray({
		control,
		name: 'personalExpenses',
	});

	const { data: defaultCompanyExpenses } = useDefaultExpenses('company');
	const { data: defaultPersonalExpenses } = useDefaultExpenses('personal');

	const { data: existingSettlement } = useDriverSettlementByDriverAndMonth(
		driverId,
		format(targetMonth, 'yyyy-MM-dd'),
		!!driverId && !editingSettlement,
	);

	// Mutations
	const createMutation = useCreateDriverSettlement();
	const updateMutation = useUpdateDriverSettlement();

	// Watch ALL form fields to trigger recalculation on any change
	const watchAllFields = watch();

	// Calculations - this will recalculate whenever ANY field changes
	const calculations = useMemo(() => {
		const companyExpenses = watchAllFields.companyExpenses || [];
		const personalExpenses = watchAllFields.personalExpenses || [];
		const profitShareRatio = watchAllFields.profitShareRatio || 50;

		const companyTotal = companyExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
		const personalTotal = personalExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

		// These would come from the API in a real implementation
		const income = existingSettlement?.income || editingSettlement?.income || 0;
		const incomeCash = existingSettlement?.incomeCash || editingSettlement?.incomeCash || 0;
		const feeSplitAmount = existingSettlement?.feeSplitAmount ?? editingSettlement?.feeSplitAmount ?? 0;
		const totalIncome = income + incomeCash + feeSplitAmount;

		const profitableAmount = totalIncome - companyTotal - personalTotal;
		const bonus = profitableAmount * (Number(profitShareRatio) / 100);
		const finalAmount = bonus + personalTotal - incomeCash;

		return {
			income,
			incomeCash,
			feeSplitAmount,
			totalIncome,
			companyTotal,
			personalTotal,
			profitableAmount,
			bonus,
			finalAmount,
		};
	}, [watchAllFields, existingSettlement, editingSettlement]);

	// Initialize default expenses
	useEffect(() => {
		if (
			defaultCompanyExpenses &&
			companyExpenseFields.length === 0 &&
			!editingSettlement &&
			!hasInitializedExpenses.current
		) {
			defaultCompanyExpenses.forEach((expense) => {
				appendCompanyExpense(expense);
			});
			hasInitializedExpenses.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultCompanyExpenses]);

	// Auto-calculate tax based on income
	useEffect(() => {
		const income = existingSettlement?.income || editingSettlement?.income || 0;

		if (income > 0 && companyExpenseFields.length > 0) {
			const taxAmount = income * 0.05;

			// Find the tax expense item by name
			const taxIndex = companyExpenseFields.findIndex((_field, index) => {
				const expenseName = watch(`companyExpenses.${index}.name`);
				return expenseName === '稅金';
			});

			if (taxIndex >= 0) {
				// Update the tax amount
				setValue(`companyExpenses.${taxIndex}.amount`, taxAmount);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [existingSettlement?.income, editingSettlement?.income, companyExpenseFields.length]);

	// Auto-fill profit share ratio from driver's default when creating new settlement
	useEffect(() => {
		if (!editingSettlement && drivers && driverId) {
			const selectedDriver = drivers.find((d) => d.id === driverId);
			if (selectedDriver?.profitShareRatio) {
				setValue('profitShareRatio', selectedDriver.profitShareRatio);
			}
		}
	}, [drivers, driverId, editingSettlement, setValue]);

	const onSubmit = async (data: SettlementFormData) => {
		try {
			const submitData = {
				driverId: data.driverId,
				targetMonth: format(data.targetMonth, 'yyyy-MM'),
				profitShareRatio: data.profitShareRatio,
				companyExpenses: data.companyExpenses,
				personalExpenses: data.personalExpenses,
			};

			if (editingSettlement) {
				await updateMutation.mutateAsync({ settlementId: editingSettlement.settlementId, data: submitData });
			} else {
				await createMutation.mutateAsync(submitData);
			}

			onSuccess();
		} catch (error) {
			console.error('Failed to save settlement:', error);
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('zh-TW', {
			style: 'currency',
			currency: 'TWD',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	if (driversLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box component="form" onSubmit={handleSubmit(onSubmit)}>
			<Grid container spacing={3}>
				{/* Basic Info */}
				<Grid item xs={12}>
					<Typography variant="h6" gutterBottom>
						基本資訊
					</Typography>
				</Grid>

				<Grid item xs={12} sm={4}>
					<TextField
						label="司機"
						value={drivers?.find((d) => d.id === driverId)?.name || ''}
						disabled
						fullWidth
					/>
				</Grid>

				<Grid item xs={12} sm={4}>
					<TextField label="結算月份" value={format(targetMonth, 'yyyy年MM月')} disabled fullWidth />
				</Grid>

				<Grid item xs={12} sm={4}>
					<Controller
						name="profitShareRatio"
						control={control}
						rules={{ required: '請輸入分紅比例', min: 0, max: 100 }}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								label="分紅比例 (%)"
								type="number"
								fullWidth
								disabled={mode === 'view'}
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
								inputProps={{ min: 0, max: 100, step: 1 }}
							/>
						)}
					/>
				</Grid>

				{/* Income Summary */}
				{driverId && (
					<Grid item xs={12}>
						<Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
							<Typography variant="subtitle1" gutterBottom>
								收入資訊
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={3}>
									<Typography variant="body2" color="text.secondary">
										發票收入
									</Typography>
									<Typography variant="h6">{formatCurrency(calculations.income)}</Typography>
								</Grid>
								<Grid item xs={3}>
									<Typography variant="body2" color="text.secondary">
										現金收入
									</Typography>
									<Typography variant="h6">{formatCurrency(calculations.incomeCash)}</Typography>
								</Grid>
								<Grid item xs={3}>
									<Typography variant="body2" color="text.secondary">
										分攤金額
									</Typography>
									<Typography
										variant="h6"
										color={calculations.feeSplitAmount > 0 ? 'warning.main' : 'text.primary'}
									>
										{formatCurrency(calculations.feeSplitAmount)}
									</Typography>
								</Grid>
								<Grid item xs={3}>
									<Typography variant="body2" color="text.secondary">
										收入總額
									</Typography>
									<Typography variant="h6" color="primary">
										{formatCurrency(calculations.totalIncome)}
									</Typography>
								</Grid>
							</Grid>
						</Paper>
					</Grid>
				)}

				{/* Company Expenses */}
				<Grid item xs={6}>
					<Typography variant="h6" gutterBottom>
						公司支出
					</Typography>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>支出項目</TableCell>
									<TableCell align="right">金額</TableCell>
									<TableCell align="center" width={100}>
										操作
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{companyExpenseFields
									.filter(
										(_, index) =>
											mode === 'edit' || Number(watch(`companyExpenses.${index}.amount`)) > 0,
									)
									.map((field) => {
										const actualIndex = companyExpenseFields.indexOf(field);
										return (
											<TableRow key={field.id}>
												<TableCell>
													<Controller
														name={`companyExpenses.${actualIndex}.name`}
														control={control}
														rules={{ required: mode === 'edit' && '請輸入支出項目名稱' }}
														render={({ field: nameField }) => (
															<TextField
																{...nameField}
																size="small"
																placeholder="支出項目名稱"
																fullWidth
																variant="standard"
																disabled={mode === 'view'}
															/>
														)}
													/>
												</TableCell>
												<TableCell>
													<Controller
														name={`companyExpenses.${actualIndex}.amount`}
														control={control}
														rules={{ required: mode === 'edit' && '請輸入金額', min: 0 }}
														render={({ field: amountField }) => (
															<TextField
																{...amountField}
																size="small"
																type="number"
																placeholder="0"
																inputProps={{ min: 0 }}
																variant="standard"
																sx={{ width: '100px' }}
																disabled={mode === 'view'}
															/>
														)}
													/>
												</TableCell>
												{mode === 'edit' && (
													<TableCell align="center">
														<IconButton
															size="small"
															onClick={() => removeCompanyExpense(actualIndex)}
															color="error"
														>
															<Delete />
														</IconButton>
													</TableCell>
												)}
											</TableRow>
										);
									})}
								<TableRow>
									<TableCell colSpan={2} align="right">
										<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
											公司支出總額: {formatCurrency(calculations.companyTotal)}
										</Typography>
									</TableCell>
									{mode === 'edit' && (
										<TableCell>
											<Button
												size="small"
												startIcon={<Add />}
												onClick={() => appendCompanyExpense({ name: '', amount: 0 })}
											>
												新增
											</Button>
										</TableCell>
									)}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</Grid>

				{/* Personal Expenses */}
				<Grid item xs={6}>
					<Typography variant="h6" gutterBottom>
						個人支出
					</Typography>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>支出項目</TableCell>
									<TableCell align="right">金額</TableCell>
									<TableCell align="center" width={100}>
										操作
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{personalExpenseFields
									.filter(
										(_, index) =>
											mode === 'edit' || Number(watch(`personalExpenses.${index}.amount`)) > 0,
									)
									.map((field) => {
										const actualIndex = personalExpenseFields.indexOf(field);
										return (
											<TableRow key={field.id}>
												<TableCell>
													<Controller
														name={`personalExpenses.${actualIndex}.name`}
														control={control}
														rules={{ required: mode === 'edit' && '請輸入支出項目名稱' }}
														render={({ field: nameField }) => (
															<TextField
																{...nameField}
																size="small"
																placeholder="支出項目名稱"
																fullWidth
																variant="standard"
																disabled={mode === 'view'}
															/>
														)}
													/>
												</TableCell>
												<TableCell>
													<Controller
														name={`personalExpenses.${actualIndex}.amount`}
														control={control}
														rules={{ required: mode === 'edit' && '請輸入金額', min: 0 }}
														render={({ field: amountField }) => (
															<TextField
																{...amountField}
																size="small"
																type="number"
																placeholder="0"
																inputProps={{ min: 0 }}
																variant="standard"
																sx={{ width: '100px' }}
																disabled={mode === 'view'}
															/>
														)}
													/>
												</TableCell>
												{mode === 'edit' && (
													<TableCell align="center">
														<IconButton
															size="small"
															onClick={() => removePersonalExpense(actualIndex)}
															color="error"
														>
															<Delete />
														</IconButton>
													</TableCell>
												)}
											</TableRow>
										);
									})}
								<TableRow>
									<TableCell colSpan={2} align="right">
										<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
											個人支出總額: {formatCurrency(calculations.personalTotal)}
										</Typography>
									</TableCell>
									{mode === 'edit' && (
										<TableCell>
											<Button
												size="small"
												startIcon={<Add />}
												onClick={() => appendPersonalExpense({ name: '', amount: 0 })}
											>
												新增
											</Button>
										</TableCell>
									)}
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</Grid>

				{/* Calculation Summary */}
				<Grid item xs={12}>
					<Paper sx={{ p: 3, bgcolor: 'primary.50' }}>
						<Typography variant="h6" gutterBottom>
							結算摘要
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={4}>
								<Typography variant="body2" color="text.secondary">
									可分紅金額 (收入 - 公司支出 - 個人支出)
								</Typography>
								<Typography variant="h6">{formatCurrency(calculations.profitableAmount)}</Typography>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Typography variant="body2" color="text.secondary">
									分紅獎金 (可分紅金額 × {watchAllFields.profitShareRatio || 50}%)
								</Typography>
								<Typography variant="h6" color="primary">
									{formatCurrency(calculations.bonus)}
								</Typography>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Typography variant="body2" color="text.secondary">
									最終可領金額 (分紅獎金 + 個人支出 - 現金收入)
								</Typography>
								<Typography
									variant="h6"
									color={calculations.finalAmount >= 0 ? 'success.main' : 'error.main'}
									sx={{ fontWeight: 'bold' }}
								>
									{formatCurrency(calculations.finalAmount)}
								</Typography>
							</Grid>
						</Grid>
					</Paper>
				</Grid>

				{/* Form Actions */}
				<Grid item xs={12}>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
						{mode === 'view' ? (
							<>
								{onEdit && (
									<Button onClick={onEdit} variant="contained">
										編輯
									</Button>
								)}
								{onDelete && (
									<Button onClick={onDelete} color="error" variant="contained">
										刪除
									</Button>
								)}
							</>
						) : (
							<>
								<Button onClick={onCancel} color="error" variant="outlined">
									取消
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={createMutation.isPending || updateMutation.isPending}
								>
									{createMutation.isPending || updateMutation.isPending ? '儲存中...' : '儲存'}
								</Button>
							</>
						)}
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
}

export default DriverSettlementForm;
