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
	Checkbox,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { Company } from '../../../Settings/types/company';
import { companiesData } from '../../../Settings/constant/company-data';

interface InvoiceDialogProps {
	open: boolean;
	onClose: () => void;
	waybillList: Waybill[];
	onCreate: (description: string) => void;
}

export function InvoiceDialog({ open, onClose, waybillList, onCreate }: InvoiceDialogProps) {
	const [selectedCompany, setSelectedCompany] = useState<string>('');
	const [invoiceAmount, setInvoiceAmount] = useState<string>('');
	const [invoiceDesc, setInvoiceDesc] = useState<string>('');

	/**
	 * 記錄每筆 waybill row 下，每個 extraExpense 是否被選取
	 * 結構: { [rowId]: { [extraIdx]: boolean } }
	 */
	const [includedExtraExpenses, setIncludedExtraExpenses] = useState<Record<string, Record<number, boolean>>>({});

	// 當 open 為 true 時，自動帶入公司與金額，並初始化額外支出勾選狀態
	useEffect(() => {
		if (open && waybillList.length > 0) {
			const firstRow = waybillList[0];
			if (firstRow) {
				let matchedCompanyId = '';
				if (firstRow.customerId) {
					matchedCompanyId = firstRow.customerId;
				} else if (firstRow.customerName) {
					const found = companiesData.find((c) => c.name === firstRow.customerName);
					if (found) matchedCompanyId = found.id;
				}
				if (matchedCompanyId) {
					setSelectedCompany(matchedCompanyId);
				}
			}
			// 初始化 includedExtraExpenses，預設全選
			const initial: Record<string, Record<number, boolean>> = {};
			waybillList.forEach((row) => {
				if (row.extraExpenses) {
					initial[row.id ?? ''] = {};
					row.extraExpenses.forEach((_, idx) => {
						initial[row.id ?? ''][idx] = true;
					});
				}
			});
			setIncludedExtraExpenses(initial);
		}
		if (!open) {
			setSelectedCompany('');
			setInvoiceAmount('');
			setInvoiceDesc('');
			setIncludedExtraExpenses({});
		}
	}, [open, waybillList]);

	// 當 includedExtraExpenses 變動時，自動更新發票金額
	useEffect(() => {
		if (open) {
			setInvoiceAmount(calculateTotalAmount().toString());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [includedExtraExpenses]);

	// 處理對話框關閉並重置表單
	const handleClose = () => {
		onClose();
		setSelectedCompany('');
		setInvoiceAmount('');
		setInvoiceDesc('');
		setIncludedExtraExpenses({});
	};

	// 處理發票提交
	const handleSubmit = () => {
		if (!selectedCompany || !invoiceAmount) {
			alert('請填寫必要資訊');
			return;
		}
		onCreate(invoiceDesc);
		handleClose();
	};

	// 獲取選中的公司詳細資料
	const getSelectedCompanyDetails = (): Company | undefined => {
		return companiesData.find((company) => company.id === selectedCompany);
	};

	// 計算選中項目的總金額（僅納入被勾選的額外支出）
	function calculateTotalAmount(): number {
		return waybillList?.reduce((sum, row) => {
			const base = row.fee || 0;
			const extra =
				row.extraExpenses?.reduce((acc, expense, idx) => {
					if (includedExtraExpenses[row.id ?? '']?.[idx]) {
						return acc + expense.fee;
					}
					return acc;
				}, 0) || 0;
			return sum + base + extra;
		}, 0);
	}

	// 新增：計算總稅金
	function calculateTotalTax(): number {
		const subtotal = calculateTotalAmount();
		return subtotal * 0.2;
	}

	// 新增：計算含稅總額
	function calculateTotalAmountWithTax(): number {
		const subtotal = calculateTotalAmount();
		const tax = subtotal * 0.2;
		return subtotal + tax;
	}

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>開立發票</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={3}>
					<FormControl fullWidth>
						<InputLabel id="company-select-label">選擇公司</InputLabel>
						<Select
							labelId="company-select-label"
							value={selectedCompany}
							label="選擇公司"
							onChange={(e) => setSelectedCompany(e.target.value)}
						>
							{companiesData.map((company) => (
								<MenuItem key={company.id} value={company.id}>
									{company.name} ({company.taxNumber})
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{selectedCompany && (
						<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
							<Typography variant="subtitle1" gutterBottom>
								公司資訊
							</Typography>
							{getSelectedCompanyDetails() && (
								<Stack spacing={1}>
									<Typography variant="body2">
										統一編號: {getSelectedCompanyDetails()?.taxNumber}
									</Typography>
									<Typography variant="body2">
										地址: {getSelectedCompanyDetails()?.address}
									</Typography>
									<Typography variant="body2">
										電話: {getSelectedCompanyDetails()?.phone?.join(', ')}
									</Typography>
								</Stack>
							)}
						</Box>
					)}

					<TextField
						label="發票金額（含稅）"
						type="number"
						value={calculateTotalAmountWithTax()}
						fullWidth
						InputProps={{ readOnly: true }}
						helperText={`未稅: ${calculateTotalAmount()}，稅金: ${calculateTotalTax()}，含稅: ${calculateTotalAmountWithTax()}`}
					/>

					<TextField
						label="發票說明"
						value={invoiceDesc}
						onChange={(e) => setInvoiceDesc(e.target.value)}
						fullWidth
						multiline
						rows={1}
					/>

					<Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
						<Typography variant="subtitle1" gutterBottom>
							選中項目 ({waybillList?.length})
						</Typography>
						<TableContainer sx={{ maxHeight: '200px' }}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>客戶</TableCell>
										<TableCell>日期</TableCell>
										<TableCell align="right">金額</TableCell>
										<TableCell align="right">額外支出</TableCell>
										<TableCell align="right">稅金</TableCell>
										<TableCell align="right">發票金額（含稅）</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{waybillList?.map((row) => {
										// 計算該 row 被勾選的額外支出總額
										const includedExtra =
											row.extraExpenses?.reduce((acc, expense, idx) => {
												if (includedExtraExpenses[row.id ?? '']?.[idx]) {
													return acc + expense.fee;
												}
												return acc;
											}, 0) || 0;
										const subtotal = (row.fee || 0) + includedExtra;
										const tax = subtotal * 0.2;
										const invoiceTotal = subtotal + tax;
										return (
											<>
												<TableRow key={row.id}>
													<TableCell>{row.customerName}</TableCell>
													<TableCell>{row.date}</TableCell>
													<TableCell align="right">{row.fee}</TableCell>
													<TableCell align="right">
														{/* 顯示額外支出總額 */}
														{row.extraExpenses?.reduce(
															(acc, expense) => acc + expense.fee,
															0,
														)}
													</TableCell>
													<TableCell align="right">{tax}</TableCell>
													<TableCell align="right">{invoiceTotal}</TableCell>
												</TableRow>
												{/* 額外支出明細，並可勾選是否納入 */}
												{row.extraExpenses?.length > 0 && (
													<TableRow>
														<TableCell colSpan={6} sx={{ background: '#fafafa' }}>
															<Stack spacing={1} direction="row" flexWrap="wrap">
																{row.extraExpenses.map((expense, idx) => (
																	<Box
																		key={idx}
																		display="flex"
																		alignItems="center"
																		mr={2}
																	>
																		<Checkbox
																			checked={
																				includedExtraExpenses[row.id ?? '']?.[
																					idx
																				] ?? false
																			}
																			onChange={(e) => {
																				setIncludedExtraExpenses((prev) => ({
																					...prev,
																					[row.id ?? '']: {
																						...prev[row.id ?? ''],
																						[idx]: e.target.checked,
																					},
																				}));
																			}}
																		/>
																		<Typography variant="body2">
																			{expense.item}：{expense.fee} 元
																		</Typography>
																	</Box>
																))}
															</Stack>
														</TableCell>
													</TableRow>
												)}
											</>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>取消</Button>
				<Button variant="contained" onClick={handleSubmit}>
					確認開立
				</Button>
			</DialogActions>
		</Dialog>
	);
}
