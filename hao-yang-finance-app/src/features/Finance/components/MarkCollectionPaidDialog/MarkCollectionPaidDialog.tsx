import { useState } from 'react';

import {
	Alert,
	Box,
	Button,
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
	Typography,
} from '@mui/material';
import { format } from 'date-fns';

import { useMarkCollectionPaid } from '../../../../hooks/useCollectionRequest';
import { CollectionRequest, MarkCollectionPaidDto } from '../../types/collection-request.types';

interface MarkCollectionPaidDialogProps {
	open: boolean;
	collectionRequest: CollectionRequest;
	onClose: () => void;
}

export function MarkCollectionPaidDialog({ open, collectionRequest, onClose }: MarkCollectionPaidDialogProps) {
	const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
	const [paymentMethod, setPaymentMethod] = useState('轉帳');
	const [paymentNotes, setPaymentNotes] = useState('');

	const markPaidMutation = useMarkCollectionPaid();

	const handleSubmit = async () => {
		const dto: MarkCollectionPaidDto = {
			paymentReceivedAt: paymentDate,
			paymentMethod,
			paymentNotes: paymentNotes || undefined,
		};

		try {
			await markPaidMutation.mutateAsync({ id: collectionRequest.id, dto });
			onClose();
		} catch (error) {
			console.error('標記已收款失敗:', error);
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('zh-TW', {
			style: 'currency',
			currency: 'TWD',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>標記請款單為已收款</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 1 }}>
					{/* 請款單資訊 */}
					<Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
						<Typography variant="caption" color="text.secondary">
							請款單號
						</Typography>
						<Typography variant="body1" fontWeight="bold" gutterBottom>
							{collectionRequest.requestNumber}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							公司名稱
						</Typography>
						<Typography variant="body1" gutterBottom>
							{collectionRequest.companyName}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							收款金額
						</Typography>
						<Typography variant="h6" color="primary">
							{formatCurrency(collectionRequest.totalAmount)}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							託運單數量
						</Typography>
						<Typography variant="body2">{collectionRequest.waybillCount} 筆</Typography>
					</Box>

					{/* 收款資訊輸入 */}
					<TextField
						label="收款日期"
						type="date"
						value={paymentDate}
						onChange={(e) => setPaymentDate(e.target.value)}
						fullWidth
						required
						InputLabelProps={{ shrink: true }}
					/>

					<FormControl fullWidth required>
						<InputLabel>收款方式</InputLabel>
						<Select
							value={paymentMethod}
							label="收款方式"
							onChange={(e) => setPaymentMethod(e.target.value)}
						>
							<MenuItem value="現金">現金</MenuItem>
							<MenuItem value="轉帳">轉帳</MenuItem>
							<MenuItem value="支票">支票</MenuItem>
							<MenuItem value="匯款">匯款</MenuItem>
							<MenuItem value="其他">其他</MenuItem>
						</Select>
					</FormControl>

					<TextField
						label="收款備註"
						value={paymentNotes}
						onChange={(e) => setPaymentNotes(e.target.value)}
						multiline
						rows={3}
						fullWidth
						placeholder="輸入收款相關備註資訊（選填）"
					/>

					<Alert variant="filled" severity="success">
						確認後，此請款單將標記為「已收款」，所有關聯的託運單（{collectionRequest.waybillCount}{' '}
						筆）將自動更新為「已收款」狀態。
					</Alert>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={markPaidMutation.isPending}>
					取消
				</Button>
				<Button
					variant="contained"
					color="success"
					onClick={handleSubmit}
					disabled={markPaidMutation.isPending || !paymentDate || !paymentMethod}
				>
					{markPaidMutation.isPending ? '處理中...' : '確認收款'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
