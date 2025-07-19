import { useEffect, useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { generateUUID } from '../../../../utils/general';
import CompanyForm from '../../../Settings/components/CompanyForm/CompanyForm';
import { Company, CreateCompanyDto } from '../../../Settings/types/company';
import { Driver } from '../../../Settings/types/driver';
import { WaybillFormData } from '../../types/waybill.types';

// 定義樣式化組件
const StyledPaper = styled(Box)(({ theme }) => ({
	padding: theme.spacing(2),
	maxWidth: '600px',
	minWidth: '600px',
	width: '600px',
	overflow: 'auto',
	height: '100%',
	border: '1px solid #DDDDDE',
	borderRadius: '10px',
}));

const FormContainer = styled(Box)(({ theme }) => ({
	height: 'fit-content',
}));

const FormRow = styled(Box)(({ theme }) => ({
	display: 'grid',
	width: '100%',
	gridTemplateColumns: '100px 1fr',
	'& > *': {
		border: '1px solid black',
		padding: theme.spacing(1),
		minHeight: '40px',
		display: 'flex',
		alignItems: 'center',
	},
	'& > :first-of-type': {
		backgroundColor: '#f5f5f5',
		justifyContent: 'center',
		fontWeight: 'bold',
	},
}));

// 新增 height prop 的介面
interface StyledTextFieldProps {
	height?: string | number;
}

// 修改 StyledTextField 的定義
const StyledTextField = styled(TextField, {
	shouldForwardProp: (prop) => prop !== 'height',
})<StyledTextFieldProps>(({ theme, height }) => ({
	'& .MuiOutlinedInput-root': {
		padding: '0',
		height: height || '35px', // 使用傳入的 height 或預設值
		'& fieldset': {
			borderColor: 'black',
			borderWidth: '1px',
		},
		'&:hover fieldset': {
			borderColor: 'black',
			borderWidth: '1px',
		},
		'&.Mui-focused fieldset': {
			borderColor: 'black',
			borderWidth: '1px',
		},
		'&.MuiAutocomplete-inputRoot': {
			height: 'auto',
			padding: '0 8px',
			'& input': {
				padding: '8px 0 !important',
				height: '19px',
			},
		},

		textarea: {
			maxWidth: '450px',
			height: 'fit-content',
			fieldSizing: 'content',
		},
	},
	'& .MuiInputBase-input': {
		padding: '8px',
	},
}));

interface WaybillFormProps {
	initialData: WaybillFormData | null;
	drivers: Driver[];
	companies: Company[];
	readonly: boolean;
	onSave: (data: WaybillFormData) => void;
	onAddCompany: (company: Company) => void; // 新增公司的回調函數
}

function WaybillForm({ initialData, onSave, drivers, companies, onAddCompany, readonly = false }: WaybillFormProps) {
	const navigate = useNavigate();
	// 新增公司相關狀態
	const [companyFormOpen, setCompanyFormOpen] = useState(false);
	const [inputValue, setInputValue] = useState(''); // 保存用戶輸入的值
	const [updatedCompanies, setUpdatedCompanies] = useState<Company[]>(companies); // 本地公司列表
	const [newCompanyName, setNewCompanyName] = useState(''); // 保存要新增的公司名稱

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
		setValue,
		watch,
		reset,
	} = useForm<WaybillFormData>({
		defaultValues: initialData || {
			id: '',
			date: new Date().toISOString().split('T')[0],
			item: '',
			companyName: '',
			companyId: undefined,
			loadingLocations: [{ from: '', to: '' }],
			workingTime: {
				start: '',
				end: '',
			},
			fee: 0,
			driverName: '',
			driverId: undefined,
			plateNumber: '',
			notes: '',
		},
	});

	useEffect(() => {
		if (initialData) {
			reset(initialData);
			// 同時重置 Autocomplete 的 inputValue
			setInputValue(initialData.companyName || '');
		} else {
			// 如果沒有 initialData，確保 inputValue 也被清空
			setInputValue('');
		}
	}, [initialData, reset]);

	// 同步公司列表
	useEffect(() => {
		setUpdatedCompanies(companies);
	}, [companies]);

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'loadingLocations',
	});

	const {
		fields: extraExpenseFields,
		append: appendExtraExpense,
		remove: removeExtraExpense,
	} = useFieldArray({
		control,
		name: 'extraExpenses',
	});

	// 處理新增公司
	const handleAddCompany = (newCompany: Company) => {
		// 更新本地公司列表
		setUpdatedCompanies((prev) => [...prev, newCompany]);
		// 調用父組件的回調函數
		onAddCompany(newCompany);
		// 自動選中新建的公司
		setValue('companyName', newCompany.name);
		setValue('companyId', newCompany.id);
		setInputValue(newCompany.name); // 更新輸入值
		// 關閉對話框並清除狀態
		setCompanyFormOpen(false);
		setNewCompanyName('');
	};

	// 新增裝卸地點
	const handleAddLocation = () => {
		append({ from: '', to: '' });
	};

	// 移除裝卸地點
	const handleRemoveLocation = (index: number) => {
		if (fields.length > 1) {
			remove(index);
		}
	};

	const onSubmit = (data: WaybillFormData) => {
		onSave(data);
		reset(data);
	};

	// 處理取消按鈕點擊
	const handleCancel = () => {
		if (isDirty) {
			// 如果表單有更改，詢問用戶是否確定要離開
			if (window.confirm('表單內容已更改，確定要離開嗎？')) {
				navigate('/waybill');
			}
		} else {
			navigate('/waybill');
		}
	};

	return (
		<StyledPaper>
			<Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
				皓揚起重工程行
			</Typography>
			<Typography variant="h6" align="center" gutterBottom sx={{ textDecoration: 'underline', mb: 2 }}>
				託運單
			</Typography>

			<form onSubmit={handleSubmit(onSubmit)}>
				<FormContainer>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
								<Typography>送貨日期：</Typography>
								<Controller
									name="date"
									control={control}
									rules={{ required: '請輸入送貨日期' }}
									render={({ field }) => (
										<StyledTextField
											{...field}
											placeholder="請輸入送貨日期"
											type="date"
											size="small"
											error={!!errors.date}
											helperText={errors.date?.message}
										/>
									)}
								/>
							</Stack>
							<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
								<Typography>托運單號：</Typography>
								<Controller
									name="waybillNumber"
									control={control}
									rules={{ required: '請輸入托運單號' }}
									render={({ field }) => (
										<StyledTextField
											{...field}
											placeholder="請輸入托運單號"
											type="text"
											size="small"
											error={!!errors.waybillNumber}
											helperText={errors.waybillNumber?.message}
										/>
									)}
								/>
							</Stack>
						</Box>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
								<Typography width="50px">司機：</Typography>
								<Controller
									name="driverName"
									control={control}
									rules={{ required: '請輸入司機姓名' }}
									render={({ field: { onChange, value, ...field } }) => (
										<Autocomplete
											freeSolo
											options={drivers}
											getOptionLabel={(option) =>
												typeof option === 'string' ? option : option.name
											}
											value={value || null}
											onChange={(_, newValue) => {
												if (newValue && typeof newValue !== 'string') {
													onChange(newValue.name);
													setValue('driverId', newValue.id);
												} else {
													onChange(newValue);
													setValue('driverId', '');
												}
											}}
											renderInput={(params) => (
												<StyledTextField
													{...params}
													{...field}
													fullWidth
													size="small"
													sx={{ width: '140px' }}
													error={!!errors.driverName}
													helperText={errors.driverName?.message}
													placeholder="請輸入司機姓名"
												/>
											)}
										/>
									)}
								/>
							</Stack>
							<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
								<Typography width="50px">噸數：</Typography>
								<Controller
									name="tonnage"
									control={control}
									rules={{ required: '請輸入噸數' }}
									render={({ field }) => (
										<StyledTextField
											{...field}
											fullWidth
											size="small"
											sx={{ width: '140px' }}
											error={!!errors.tonnage}
											helperText={errors.tonnage?.message}
											placeholder="請輸入噸數"
										/>
									)}
								/>
							</Stack>
						</Box>
					</Box>

					<FormRow>
						<Typography>貨主</Typography>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: 2,
								p: 1,
							}}
						>
							<Controller
								name="companyName"
								control={control}
								rules={{ required: '請輸入貨主名稱' }}
								render={({ field: { onChange, value, ...field } }) => {
									// 檢查輸入的名稱是否在現有公司列表中
									const isExistingCompany = updatedCompanies.some(
										(company) => company.name === inputValue,
									);

									// 創建選項列表
									const options = [...updatedCompanies];

									// 如果用戶輸入了不在列表中的名稱，添加「新增」選項
									if (inputValue && !isExistingCompany) {
										const addNewCompanyOption: CreateCompanyDto = {
											id: 'ADD_NEW_COMPANY',
											name: `新增 ${inputValue}`,
											taxId: '',
											address: '',
											phone: [],
											contactPerson: '',
											email: '',
										};
										options.push(addNewCompanyOption as unknown as Company);
									}

									return (
										<Autocomplete
											freeSolo
											fullWidth
											options={options}
											getOptionLabel={(option) =>
												typeof option === 'string' ? option : option.name
											}
											getOptionKey={(option) => (typeof option === 'string' ? option : option.id)}
											value={value || null}
											inputValue={inputValue}
											onInputChange={(_, newValue) => {
												setInputValue(newValue || '');
											}}
											onChange={(_, newValue) => {
												if (newValue && typeof newValue !== 'string') {
													// 如果選擇了「新增公司」選項
													if (newValue.id === 'ADD_NEW_COMPANY') {
														setNewCompanyName(inputValue); // 保存純粹的公司名稱
														setCompanyFormOpen(true);
														return;
													}
													// 選擇了現有公司
													onChange(newValue.name);
													setValue('companyId', newValue.id);
													setInputValue(newValue.name);
												} else {
													// 輸入了自定義值
													onChange(newValue || '');
													setValue('companyId', undefined);
													setInputValue(newValue || '');
												}
											}}
											renderInput={(params) => (
												<StyledTextField
													{...params}
													{...field}
													fullWidth
													size="small"
													error={!!errors.companyName}
													helperText={errors.companyName?.message}
													placeholder="請輸入貨主名稱"
												/>
											)}
										/>
									);
								}}
							/>
						</Box>
					</FormRow>

					<FormRow>
						<Typography>貨名</Typography>
						<Box sx={{ p: 1 }}>
							<Controller
								name="item"
								control={control}
								rules={{ required: '請輸入貨名' }}
								render={({ field }) => (
									<StyledTextField
										{...field}
										fullWidth
										size="small"
										error={!!errors.item}
										helperText={errors.item?.message}
										placeholder="請輸入貨名"
									/>
								)}
							/>
						</Box>
					</FormRow>

					<FormRow>
						<Typography>裝卸地點</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1, width: '100%' }}>
							{fields.map((field, index) => (
								<Box
									key={field.id}
									sx={{
										display: 'flex',
										gap: 1,
										alignItems: 'center',
										width: '100%',
									}}
								>
									<Controller
										name={`loadingLocations.${index}.from`}
										control={control}
										rules={{ required: '請輸入起點' }}
										render={({ field }) => (
											<StyledTextField
												{...field}
												fullWidth
												size="small"
												error={!!errors.loadingLocations?.[index]?.from}
												helperText={errors.loadingLocations?.[index]?.from?.message}
												placeholder="請輸入起點"
											/>
										)}
									/>
									<Typography>至</Typography>
									<Controller
										name={`loadingLocations.${index}.to`}
										control={control}
										rules={{ required: '請輸入終點' }}
										render={({ field }) => (
											<StyledTextField
												{...field}
												fullWidth
												size="small"
												placeholder="請輸入終點"
												error={!!errors.loadingLocations?.[index]?.to}
												helperText={errors.loadingLocations?.[index]?.to?.message}
											/>
										)}
									/>
									<IconButton
										size="small"
										color="error"
										onClick={() => handleRemoveLocation(index)}
										disabled={fields.length === 1}
									>
										<DeleteIcon />
									</IconButton>
								</Box>
							))}
							<Button
								sx={{ width: '100%' }}
								variant="contained"
								color="primary"
								onClick={handleAddLocation}
								disabled={readonly}
							>
								新增裝卸地點
							</Button>
						</Box>
					</FormRow>

					<FormRow>
						<Typography>用車時間</Typography>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}>
							<Controller
								name="workingTime.start"
								control={control}
								rules={{ required: '請輸入開始時間' }}
								render={({ field }) => (
									<StyledTextField
										{...field}
										fullWidth
										size="small"
										type="time"
										error={!!errors.workingTime?.start}
										helperText={errors.workingTime?.start?.message}
										placeholder="請輸入開始時間"
									/>
								)}
							/>
							<Typography>至</Typography>
							<Controller
								name="workingTime.end"
								control={control}
								rules={{ required: '請輸入結束時間' }}
								render={({ field }) => (
									<StyledTextField
										{...field}
										fullWidth
										size="small"
										type="time"
										error={!!errors.workingTime?.end}
										helperText={errors.workingTime?.end?.message}
										placeholder="請輸入結束時間"
									/>
								)}
							/>
						</Box>
					</FormRow>

					<FormRow>
						<Typography>運費</Typography>
						<Box sx={{ p: 1 }}>
							<Controller
								name="fee"
								control={control}
								rules={{
									required: '請輸入運費',
									min: { value: 0, message: '運費不能小於0' },
								}}
								render={({ field: { onChange, ...field } }) => (
									<StyledTextField
										{...field}
										onChange={(e) => {
											// 將輸入值轉換為數字
											const value = e.target.value === '' ? 0 : Number(e.target.value);
											onChange(+value);
										}}
										fullWidth
										size="small"
										type="number"
										error={!!errors.fee}
										helperText={errors.fee?.message}
										placeholder="請輸入運費"
									/>
								)}
							/>
						</Box>
					</FormRow>

					<FormRow>
						<Typography>額外費用</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}>
							{extraExpenseFields.map((field, index) => (
								<Box
									key={field.id}
									sx={{
										display: 'flex',
										gap: 1,
										alignItems: 'center',
									}}
								>
									<Controller
										name={`extraExpenses.${index}.item`}
										control={control}
										rules={{ required: '請輸入費用項目' }}
										render={({ field }) => (
											<StyledTextField
												{...field}
												fullWidth
												size="small"
												error={!!errors.extraExpenses?.[index]?.item}
												helperText={errors.extraExpenses?.[index]?.item?.message}
												placeholder="請輸入費用項目"
											/>
										)}
									/>
									<Controller
										name={`extraExpenses.${index}.fee`}
										control={control}
										rules={{ required: '請輸入費用', min: { value: 0, message: '費用不能小於0' } }}
										render={({ field }) => (
											<StyledTextField
												{...field}
												fullWidth
												size="small"
												type="number"
												error={!!errors.extraExpenses?.[index]?.fee}
												helperText={errors.extraExpenses?.[index]?.fee?.message}
												placeholder="請輸入費用"
											/>
										)}
									/>
									<Controller
										name={`extraExpenses.${index}.notes`}
										control={control}
										render={({ field }) => (
											<StyledTextField
												{...field}
												fullWidth
												size="small"
												placeholder="請輸入備註"
											/>
										)}
									/>
									<IconButton size="small" color="error" onClick={() => removeExtraExpense(index)}>
										<DeleteIcon />
									</IconButton>
								</Box>
							))}
							<Button
								sx={{ width: '100%' }}
								variant="contained"
								color="primary"
								onClick={() => appendExtraExpense({ id: generateUUID(), item: '', fee: 0, notes: '' })}
								disabled={readonly}
							>
								新增額外費用
							</Button>
						</Box>
					</FormRow>

					<FormRow>
						<Typography>備註</Typography>
						<Box sx={{ p: 1 }}>
							<Controller
								name="notes"
								control={control}
								render={({ field }) => (
									<StyledTextField
										{...field}
										height="fit-content"
										sx={{ width: '100%', fieldSizing: 'content' }}
										fullWidth
										size="small"
										multiline
										placeholder="請輸入備註"
									/>
								)}
							/>
						</Box>
					</FormRow>
				</FormContainer>

				<Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
					<Button variant="outlined" color="error" onClick={handleCancel} disabled={!isDirty || readonly}>
						取消
					</Button>
					<Button variant="contained" color="primary" type="submit" disabled={!isDirty || readonly}>
						儲存
					</Button>
				</Stack>
			</form>

			{/* 新增公司對話框 */}
			<CompanyForm
				open={companyFormOpen}
				onClose={() => {
					setCompanyFormOpen(false);
					setNewCompanyName(''); // 清除新公司名稱
				}}
				onSubmit={handleAddCompany}
				defaultName={newCompanyName} // 傳遞純粹的公司名稱（不含「新增」前綴）
			/>
		</StyledPaper>
	);
}

export default WaybillForm;
