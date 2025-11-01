import React, { useEffect, useState } from 'react';

import {
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
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

import { Waybill } from '../../../Waybill/types/waybill.types';

interface MarkPaidDialogProps {
	open: boolean;
	waybill: Waybill | null;
	onClose: () => void;
	onConfirm: (params: { paymentNotes: string; paymentDate: string; paymentMethod: string }) => Promise<void>;
	processing: boolean;
}

export function MarkPaidDialog({ open, waybill, onClose, onConfirm, processing }: MarkPaidDialogProps) {
	const [paymentNotes, setPaymentNotes] = useState('');
	const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
	const [paymentMethod, setPaymentMethod] = useState('現金');

	// Reset form when dialog opens
	useEffect(() => {
		if (open && waybill) {
			setPaymentNotes(waybill.paymentNotes || '');
			setPaymentDate(waybill.paymentReceivedAt || format(new Date(), 'yyyy-MM-dd'));
			setPaymentMethod(waybill.paymentMethod || '現金');
		}
	}, [open, waybill]);

	const handleConfirm = async () => {
		if (!waybill) return;

		await onConfirm({
			paymentNotes: paymentNotes.trim(),
			paymentDate,
			paymentMethod,
		});
	};

	if (!waybill) return null;

	const totalWithTax = waybill.taxAmount ? waybill.fee + waybill.taxAmount : waybill.fee;

	const isFormValid = paymentNotes.trim().length > 0 && paymentDate && paymentMethod;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>標記為已收款</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ mb: 2 }}>
					託運單 ID: {waybill.id}
					<br />
					客戶名稱: {waybill.companyName}
					<br />
					託運日期: {waybill.date}
				</DialogContentText>

				<Stack spacing={2} sx={{ mt: 2 }}>
					<Typography variant="body2" color="text.secondary">
						金額資訊：
					</Typography>
					<Stack direction="row" spacing={2} sx={{ pl: 2 }}>
						<Typography variant="body2">
							基本費用：<strong>{waybill.fee.toLocaleString()}</strong>
						</Typography>
						<Typography variant="body2">
							稅額（5%）：<strong>{waybill.taxAmount?.toLocaleString() || 0}</strong>
						</Typography>
						<Typography variant="body2">
							含稅總額：<strong>{totalWithTax.toLocaleString()}</strong>
						</Typography>
					</Stack>

					<TextField
						autoFocus
						required
						fullWidth
						multiline
						rows={3}
						label="收款備註"
						value={paymentNotes}
						onChange={(e) => setPaymentNotes(e.target.value)}
						placeholder="請輸入收款相關備註（例如：收款人、備註事項等）..."
						helperText="必填欄位"
					/>

					<TextField
						required
						fullWidth
						type="date"
						label="收款日期"
						value={paymentDate}
						onChange={(e) => setPaymentDate(e.target.value)}
						InputLabelProps={{
							shrink: true,
						}}
						helperText="必填欄位"
					/>

					<FormControl fullWidth required>
						<InputLabel>收款方式</InputLabel>
						<Select
							value={paymentMethod}
							onChange={(e) => setPaymentMethod(e.target.value)}
							label="收款方式"
						>
							<MenuItem value="現金">現金</MenuItem>
							<MenuItem value="轉帳">轉帳</MenuItem>
							<MenuItem value="票據">票據</MenuItem>
						</Select>
					</FormControl>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="primary" disabled={processing}>
					取消
				</Button>
				<Button
					onClick={handleConfirm}
					color="success"
					variant="contained"
					disabled={processing || !isFormValid}
				>
					{processing ? <CircularProgress size={24} /> : '確認收款'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
