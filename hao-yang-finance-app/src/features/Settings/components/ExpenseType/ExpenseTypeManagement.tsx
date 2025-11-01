import { useState } from 'react';

import { Add, Delete, Edit } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	Grid,
	IconButton,
	LinearProgress,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
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

import { usePermission } from '../../../../contexts/PermissionContext';
import { Permission } from '../../../../types/permission.types';
import {
	useCreateExpenseType,
	useDeleteExpenseType,
	useUpdateExpenseType,
} from '../../../DriverSettlement/api/mutation';
import { useExpenseTypes } from '../../../DriverSettlement/api/query';
import {
	CreateExpenseType,
	ExpenseType,
	ExpenseTypeFormData,
	FormulaType,
} from '../../../DriverSettlement/types/driver-settlement.types';

const FORMULA_OPTIONS: { value: FormulaType; label: string }[] = [
	{ value: 'fixed', label: '固定金額' },
	{ value: 'income_percentage', label: '發票收入的百分比' },
	{ value: 'income_cash_percentage', label: '現金收入的百分比' },
	{ value: 'total_income_percentage', label: '總收入的百分比' },
];

interface DialogState {
	open: boolean;
	mode: 'create' | 'edit';
	category: 'company' | 'personal';
	editingItem?: ExpenseType;
}

export function ExpenseTypeManagement() {
	const { hasPermission } = usePermission();
	const [dialogState, setDialogState] = useState<DialogState>({
		open: false,
		mode: 'create',
		category: 'company',
	});

	// Queries
	const { data: companyExpenseTypes = [], isLoading: isLoadingCompany } = useExpenseTypes('company');
	const { data: personalExpenseTypes = [], isLoading: isLoadingPersonal } = useExpenseTypes('personal');

	// Mutations
	const createMutation = useCreateExpenseType();
	const updateMutation = useUpdateExpenseType();
	const deleteMutation = useDeleteExpenseType();

	// Form
	const { control, handleSubmit, reset, watch } = useForm<ExpenseTypeFormData>({
		defaultValues: {
			name: '',
			isDefault: true,
			amountType: 'fixed',
			defaultAmount: undefined,
			formulaType: 'fixed',
			formulaValue: undefined,
		},
	});

	const amountType = watch('amountType');
	const isLoading = isLoadingCompany || isLoadingPersonal;

	const handleOpenDialog = (category: 'company' | 'personal', item?: ExpenseType) => {
		if (item) {
			// Edit mode
			const amountType = item.formula ? 'formula' : 'fixed';
			let formulaType: FormulaType = 'fixed';
			let formulaValue: number | undefined;

			if (item.formula) {
				// Parse formula to extract type and value
				if (item.formula.includes('income_cash')) {
					formulaType = 'income_cash_percentage';
				} else if (item.formula.includes('income + income_cash')) {
					formulaType = 'total_income_percentage';
				} else if (item.formula.includes('income')) {
					formulaType = 'income_percentage';
				}

				// Extract percentage value (e.g., "income * 0.05" => 5)
				const match = item.formula.match(/\*\s*([\d.]+)/);
				if (match) {
					formulaValue = parseFloat(match[1]) * 100;
				}
			}

			reset({
				name: item.name,
				isDefault: item.isDefault,
				amountType,
				defaultAmount: item.defaultAmount || undefined,
				formulaType,
				formulaValue,
			});

			setDialogState({
				open: true,
				mode: 'edit',
				category,
				editingItem: item,
			});
		} else {
			// Create mode
			reset({
				name: '',
				isDefault: true,
				amountType: 'fixed',
				defaultAmount: undefined,
				formulaType: 'fixed',
				formulaValue: undefined,
			});

			setDialogState({
				open: true,
				mode: 'create',
				category,
			});
		}
	};

	const handleCloseDialog = () => {
		setDialogState({ open: false, mode: 'create', category: 'company' });
		reset();
	};

	const handleDelete = async (id: number, name: string) => {
		if (window.confirm(`確定要刪除費用類型「${name}」嗎？`)) {
			try {
				await deleteMutation.mutateAsync(id);
			} catch (error: any) {
				alert(error.response?.data?.message || '刪除失敗');
			}
		}
	};

	const onSubmit = async (data: ExpenseTypeFormData) => {
		try {
			if (dialogState.mode === 'create') {
				const createData: CreateExpenseType = {
					category: dialogState.category,
					name: data.name,
					isDefault: data.isDefault,
					defaultAmount: data.amountType === 'fixed' ? data.defaultAmount : undefined,
					formulaType: data.amountType === 'formula' ? data.formulaType : 'fixed',
					formulaValue: data.amountType === 'formula' ? data.formulaValue : undefined,
				};
				await createMutation.mutateAsync(createData);
			} else if (dialogState.editingItem) {
				await updateMutation.mutateAsync({
					id: dialogState.editingItem.expenseTypeId,
					data: {
						name: data.name,
						isDefault: data.isDefault,
						defaultAmount: data.amountType === 'fixed' ? data.defaultAmount : undefined,
						formulaType: data.amountType === 'formula' ? data.formulaType : 'fixed',
						formulaValue: data.amountType === 'formula' ? data.formulaValue : undefined,
					},
				});
			}

			handleCloseDialog();
		} catch (error: any) {
			alert(error.response?.data?.message || '操作失敗');
		}
	};

	const formatExpenseTypeDisplay = (item: ExpenseType) => {
		if (item.formula) {
			return '(公式計算)';
		}
		if (item.defaultAmount) {
			return `$${item.defaultAmount.toLocaleString()}`;
		}
		return '-';
	};

	// Permission check
	if (!hasPermission(Permission.DriverSettlementRead)) {
		return (
			<Alert sx={{ width: '100%' }} severity="error">
				您沒有權限訪問費用類型管理功能。請聯繫系統管理員。
			</Alert>
		);
	}

	const renderExpenseTypeTable = (expenseTypes: ExpenseType[], category: 'company' | 'personal', title: string) => (
		<Card>
			<CardContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<Typography variant="h6">{title}</Typography>
					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => handleOpenDialog(category)}
						disabled={!hasPermission(Permission.DriverSettlementCreate)}
					>
						新增費用類型
					</Button>
				</Box>

				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>名稱</TableCell>
								<TableCell>預設金額/公式</TableCell>
								<TableCell align="center">是否預設</TableCell>
								<TableCell align="center">操作</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{expenseTypes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} align="center">
										暫無資料
									</TableCell>
								</TableRow>
							) : (
								expenseTypes.map((item) => (
									<TableRow key={item.expenseTypeId}>
										<TableCell>{item.name}</TableCell>
										<TableCell>{formatExpenseTypeDisplay(item)}</TableCell>
										<TableCell align="center">
											{item.isDefault && <Chip label="預設" size="small" color="primary" />}
										</TableCell>
										<TableCell align="center">
											<IconButton
												size="small"
												onClick={() => handleOpenDialog(category, item)}
												disabled={!hasPermission(Permission.DriverSettlementUpdate)}
											>
												<Edit />
											</IconButton>
											<IconButton
												size="small"
												color="error"
												onClick={() => handleDelete(item.expenseTypeId, item.name)}
												disabled={!hasPermission(Permission.DriverSettlementDelete)}
											>
												<Delete />
											</IconButton>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</CardContent>
		</Card>
	);

	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h5" gutterBottom>
				費用類型管理
			</Typography>

			{isLoading && <LinearProgress sx={{ mb: 2 }} />}

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					{renderExpenseTypeTable(companyExpenseTypes, 'company', '公司支出')}
				</Grid>
				<Grid item xs={12} md={6}>
					{renderExpenseTypeTable(personalExpenseTypes, 'personal', '個人支出')}
				</Grid>
			</Grid>

			{/* Dialog for Create/Edit */}
			<Dialog open={dialogState.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogTitle>
						{dialogState.mode === 'create' ? '新增' : '編輯'}費用類型 (
						{dialogState.category === 'company' ? '公司支出' : '個人支出'})
					</DialogTitle>
					<DialogContent>
						<Grid container spacing={2} sx={{ mt: 1 }}>
							<Grid item xs={12}>
								<Controller
									name="name"
									control={control}
									rules={{ required: '請輸入費用名稱' }}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											label="費用名稱"
											fullWidth
											error={!!fieldState.error}
											helperText={fieldState.error?.message}
										/>
									)}
								/>
							</Grid>

							<Grid item xs={12}>
								<Controller
									name="isDefault"
									control={control}
									render={({ field }) => (
										<FormControlLabel
											control={<input type="checkbox" {...field} checked={field.value} />}
											label="設為預設費用（建立結算時自動帶入）"
										/>
									)}
								/>
							</Grid>

							<Grid item xs={12}>
								<Controller
									name="amountType"
									control={control}
									render={({ field }) => (
										<FormControl>
											<FormLabel>金額類型</FormLabel>
											<RadioGroup {...field}>
												<FormControlLabel value="fixed" control={<Radio />} label="固定金額" />
												<FormControlLabel
													value="formula"
													control={<Radio />}
													label="公式計算"
												/>
											</RadioGroup>
										</FormControl>
									)}
								/>
							</Grid>

							{amountType === 'fixed' ? (
								<Grid item xs={12}>
									<Controller
										name="defaultAmount"
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												label="預設金額"
												type="number"
												fullWidth
												inputProps={{ min: 0, step: 1 }}
											/>
										)}
									/>
								</Grid>
							) : (
								<>
									<Grid item xs={12}>
										<Controller
											name="formulaType"
											control={control}
											render={({ field }) => (
												<TextField {...field} select label="公式類型" fullWidth>
													{FORMULA_OPTIONS.filter((opt) => opt.value !== 'fixed').map(
														(option) => (
															<MenuItem key={option.value} value={option.value}>
																{option.label}
															</MenuItem>
														),
													)}
												</TextField>
											)}
										/>
									</Grid>
									<Grid item xs={12}>
										<Controller
											name="formulaValue"
											control={control}
											rules={{
												required: amountType === 'formula' && '請輸入百分比',
												min: { value: 0, message: '百分比不能小於 0' },
												max: { value: 100, message: '百分比不能大於 100' },
											}}
											render={({ field, fieldState }) => (
												<TextField
													{...field}
													label="百分比 (%)"
													type="number"
													fullWidth
													inputProps={{ min: 0, max: 100, step: 0.1 }}
													error={!!fieldState.error}
													helperText={fieldState.error?.message}
												/>
											)}
										/>
									</Grid>
								</>
							)}
						</Grid>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseDialog}>取消</Button>
						<Button
							type="submit"
							variant="contained"
							disabled={createMutation.isPending || updateMutation.isPending}
						>
							{createMutation.isPending || updateMutation.isPending ? '儲存中...' : '儲存'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</Box>
	);
}
