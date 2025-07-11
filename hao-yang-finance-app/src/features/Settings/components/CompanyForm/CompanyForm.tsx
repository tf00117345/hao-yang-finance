import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Company } from '../../types/company';

// 初始表單數據
const initialFormData: Company = {
	id: '',
	name: '',
	taxNumber: '',
	address: '',
	phone: [],
};

interface CompanyFormProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: Company) => void;
	initialData?: Company | null;
	isEditing?: boolean;
	defaultName?: string; // 預設的公司名稱
}

function CompanyForm({ open, onClose, onSubmit, initialData, isEditing = false, defaultName = '' }: CompanyFormProps) {
	// React Hook Form 設置
	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<Company>({
		defaultValues: initialFormData,
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'phone',
	});

	// 當 open 狀態改變時重置表單
	useEffect(() => {
		if (open) {
			if (initialData) {
				reset(initialData);
			} else {
				reset({
					...initialFormData,
					name: defaultName, // 使用預設名稱
				});
			}
		}
	}, [open, initialData, defaultName, reset]);

	// 處理表單提交
	const handleFormSubmit = (data: Company) => {
		// 如果是新增且沒有 id，生成一個唯一的 id
		if (!isEditing && !data.id) {
			data.id = crypto.randomUUID();
		}
		onSubmit(data);
		handleClose();
	};

	// 處理對話框關閉
	const handleClose = () => {
		reset(initialFormData);
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} sx={{ '& .MuiDialog-paper': { width: '65%' } }}>
			<form onSubmit={handleSubmit(handleFormSubmit)}>
				<DialogTitle>{isEditing ? '編輯公司資料' : '新增公司'}</DialogTitle>
				<DialogContent>
					<Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							fullWidth
							label="公司名稱"
							{...register('name', { required: '請輸入公司名稱' })}
							error={!!errors.name}
							helperText={errors.name?.message}
						/>
						<TextField fullWidth label="統一編號" {...register('taxNumber')} />
						<TextField fullWidth label="地址" {...register('address')} />

						{/* 電話號碼陣列輸入區 */}
						{fields.map((field, index) => (
							<Box key={field.id} sx={{ display: 'flex', gap: 1 }}>
								<TextField fullWidth label={`電話 ${index + 1}`} {...register(`phone.${index}`)} />
								<IconButton onClick={() => remove(index)}>
									<DeleteIcon />
								</IconButton>
							</Box>
						))}
						<Button type="button" onClick={() => append('')} startIcon={<AddIcon />}>
							新增電話
						</Button>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>取消</Button>
					<Button type="submit" variant="contained">
						{isEditing ? '更新' : '新增'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default CompanyForm;
