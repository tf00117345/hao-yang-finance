import { useEffect, useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	IconButton,
	Box,
	Typography,
	Autocomplete,
	Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import { useDriversQuery } from '../../../Settings/api/query';
import { Waybill, CreateWaybillFeeSplit, WaybillFeeSplit } from '../../types/waybill.types';
import { Driver } from '../../../Settings/types/driver';

interface FeeSplitRow {
	targetDriverId: string;
	targetDriverName: string;
	amount: string;
	notes: string;
}

interface FeeSplitDialogProps {
	open: boolean;
	waybill: Waybill | null;
	onClose: () => void;
	onSave: (params: { waybillId: string; splits: CreateWaybillFeeSplit[] }) => void;
	saving: boolean;
}

const emptyRow = (): FeeSplitRow => ({
	targetDriverId: '',
	targetDriverName: '',
	amount: '',
	notes: '',
});

export function FeeSplitDialog({ open, waybill, onClose, onSave, saving }: FeeSplitDialogProps) {
	const { data: drivers = [] } = useDriversQuery();
	const [rows, setRows] = useState<FeeSplitRow[]>([]);
	const [error, setError] = useState<string>('');

	// Initialize rows from existing splits when dialog opens
	useEffect(() => {
		if (open && waybill) {
			if (waybill.feeSplits && waybill.feeSplits.length > 0) {
				setRows(
					waybill.feeSplits.map((split: WaybillFeeSplit) => ({
						targetDriverId: split.targetDriverId,
						targetDriverName: split.targetDriverName,
						amount: split.amount.toString(),
						notes: split.notes || '',
					})),
				);
			} else {
				setRows([emptyRow()]);
			}
			setError('');
		}
	}, [open, waybill]);

	if (!waybill) return null;

	const activeDrivers = drivers.filter(
		(d: Driver) => d.isActive && d.id !== waybill.driverId,
	);

	const totalSplitAmount = rows.reduce((sum, row) => {
		const amt = parseFloat(row.amount) || 0;
		return sum + amt;
	}, 0);

	const remainingForOriginalDriver = waybill.fee - totalSplitAmount;

	const handleAddRow = () => {
		setRows([...rows, emptyRow()]);
	};

	const handleRemoveRow = (index: number) => {
		const newRows = rows.filter((_, i) => i !== index);
		if (newRows.length === 0) {
			newRows.push(emptyRow());
		}
		setRows(newRows);
		setError('');
	};

	const handleDriverChange = (index: number, driver: Driver | null) => {
		const newRows = [...rows];
		if (driver) {
			newRows[index] = {
				...newRows[index],
				targetDriverId: driver.id,
				targetDriverName: driver.name,
			};
		} else {
			newRows[index] = {
				...newRows[index],
				targetDriverId: '',
				targetDriverName: '',
			};
		}
		setRows(newRows);
		setError('');
	};

	const handleAmountChange = (index: number, value: string) => {
		const newRows = [...rows];
		newRows[index] = { ...newRows[index], amount: value };
		setRows(newRows);
		setError('');
	};

	const handleNotesChange = (index: number, value: string) => {
		const newRows = [...rows];
		newRows[index] = { ...newRows[index], notes: value };
		setRows(newRows);
	};

	const validate = (): string | null => {
		// Filter out empty rows (no driver selected and no amount)
		const filledRows = rows.filter((r) => r.targetDriverId || r.amount);

		if (filledRows.length === 0) {
			return null; // No splits - will clear all
		}

		for (let i = 0; i < filledRows.length; i++) {
			if (!filledRows[i].targetDriverId) {
				return `第 ${i + 1} 行：請選擇司機`;
			}
			const amt = parseFloat(filledRows[i].amount);
			if (!amt || amt <= 0) {
				return `第 ${i + 1} 行：金額必須大於 0`;
			}
		}

		// Check duplicate drivers
		const driverIds = filledRows.map((r) => r.targetDriverId);
		const uniqueIds = new Set(driverIds);
		if (uniqueIds.size !== driverIds.length) {
			return '不可重複選擇相同司機';
		}

		// Check total doesn't exceed fee
		const total = filledRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
		if (total > waybill.fee) {
			return `分攤總額 (${total.toLocaleString()}) 不可超過原始運費 (${waybill.fee.toLocaleString()})`;
		}

		return null;
	};

	const handleSave = () => {
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		const filledRows = rows.filter((r) => r.targetDriverId && parseFloat(r.amount) > 0);
		const splits: CreateWaybillFeeSplit[] = filledRows.map((r) => ({
			targetDriverId: r.targetDriverId,
			amount: parseFloat(r.amount),
			notes: r.notes.trim() || undefined,
		}));

		onSave({ waybillId: waybill.id, splits });
	};

	// Get already-selected driver IDs to filter them out from options
	const selectedDriverIds = new Set(rows.map((r) => r.targetDriverId).filter(Boolean));

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted={false}>
			<DialogTitle>運費分攤</DialogTitle>
			<DialogContent dividers>
				{/* Waybill info summary */}
				<Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
					<Typography variant="body2" color="text.secondary">
						{waybill.date} · {waybill.companyName} · {waybill.driverName}
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
						<Typography variant="body2">
							原始運費：<strong>${waybill.fee.toLocaleString()}</strong>
						</Typography>
						<Typography variant="body2">
							已分攤：<strong>${totalSplitAmount.toLocaleString()}</strong>
						</Typography>
						<Typography
							variant="body2"
							color={remainingForOriginalDriver < 0 ? 'error' : 'text.primary'}
						>
							{waybill.driverName} 實際：
							<strong>${remainingForOriginalDriver.toLocaleString()}</strong>
						</Typography>
					</Box>
				</Box>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{/* Split rows */}
				{rows.map((row, index) => (
					<Box
						key={index}
						sx={{
							display: 'flex',
							gap: 1,
							mb: 1.5,
							alignItems: 'flex-start',
						}}
					>
						<Autocomplete
							sx={{ flex: 2 }}
							size="small"
							options={activeDrivers.filter(
								(d: Driver) =>
									d.id === row.targetDriverId || !selectedDriverIds.has(d.id),
							)}
							getOptionLabel={(option: Driver) => option.name}
							value={
								activeDrivers.find((d: Driver) => d.id === row.targetDriverId) ||
								null
							}
							onChange={(_, newValue) =>
								handleDriverChange(index, newValue as Driver | null)
							}
							renderInput={(params) => (
								<TextField {...params} placeholder="選擇司機" />
							)}
							isOptionEqualToValue={(option: Driver, value: Driver) =>
								option.id === value.id
							}
						/>
						<TextField
							sx={{ flex: 1 }}
							size="small"
							type="number"
							placeholder="金額"
							value={row.amount}
							onChange={(e) => handleAmountChange(index, e.target.value)}
							inputProps={{ min: 0, step: 'any' }}
						/>
						<TextField
							sx={{ flex: 1 }}
							size="small"
							placeholder="備註"
							value={row.notes}
							onChange={(e) => handleNotesChange(index, e.target.value)}
						/>
						<IconButton
							size="small"
							onClick={() => handleRemoveRow(index)}
							color="error"
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Box>
				))}

				<Button
					startIcon={<AddIcon />}
					onClick={handleAddRow}
					size="small"
					sx={{ mt: 0.5 }}
				>
					新增分攤
				</Button>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					取消
				</Button>
				<Button
					variant="contained"
					onClick={handleSave}
					disabled={saving}
				>
					儲存
				</Button>
			</DialogActions>
		</Dialog>
	);
}
