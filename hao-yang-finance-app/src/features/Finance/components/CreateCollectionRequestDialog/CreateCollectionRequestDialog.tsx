import { useEffect, useMemo, useState } from 'react';

import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
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

import {
	useCollectionRequestDetail,
	useCreateCollectionRequest,
	useUpdateCollectionRequest,
} from '../../../../hooks/useCollectionRequest';
import { Waybill } from '../../../Waybill/types/waybill.types';
import type {
	CollectionRequest,
	CollectionRequestWaybill,
	CreateCollectionRequestDto,
	UpdateCollectionRequestDto,
} from '../../types/collection-request.types';

interface CreateCollectionRequestDialogProps {
	open: boolean;
	waybills?: Waybill[];
	collectionRequest?: CollectionRequest;
	onClose: () => void;
	onSuccess?: () => void;
}

export function CreateCollectionRequestDialog({
	open,
	waybills = [],
	collectionRequest,
	onClose,
	onSuccess,
}: CreateCollectionRequestDialogProps) {
	const isEditMode = !!collectionRequest;

	const [requestDate, setRequestDate] = useState(format(new Date(), 'yyyy-MM-dd'));
	const [notes, setNotes] = useState('');
	const [selectedCompanyId, setSelectedCompanyId] = useState('');

	const createMutation = useCreateCollectionRequest();
	const updateMutation = useUpdateCollectionRequest();

	// 編輯模式時載入詳情
	const { data: detailData, isLoading: isLoadingDetail } = useCollectionRequestDetail(
		collectionRequest?.id || '',
		isEditMode && open,
	);

	// 初始化表單
	useEffect(() => {
		if (isEditMode && collectionRequest) {
			setRequestDate(collectionRequest.requestDate.split('T')[0]);
			setNotes(collectionRequest.notes || '');
		} else if (!isEditMode && open) {
			setRequestDate(format(new Date(), 'yyyy-MM-dd'));
			setNotes('');
			setSelectedCompanyId('');
		}
	}, [isEditMode, collectionRequest, open]);

	// 計算總金額（建立模式使用 waybills，編輯模式使用 detailData）
	const displayWaybills = useMemo(() => {
		if (isEditMode && detailData) {
			return detailData.waybills;
		}
		return waybills;
	}, [isEditMode, detailData, waybills]);

	const subtotal = useMemo(() => {
		if (isEditMode && collectionRequest) {
			return collectionRequest.subtotal;
		}
		return waybills.reduce((sum, w) => sum + w.fee, 0);
	}, [isEditMode, collectionRequest, waybills]);

	const taxRate = isEditMode && collectionRequest ? collectionRequest.taxRate : 0;
	const taxAmount = isEditMode && collectionRequest ? collectionRequest.taxAmount : subtotal * taxRate;
	const totalAmount = isEditMode && collectionRequest ? collectionRequest.totalAmount : subtotal + taxAmount;

	// 取得所有公司列表（去重）- 只在建立模式使用
	const companies = useMemo(() => {
		if (isEditMode) return [];
		const companyMap = new Map<string, { id: string; name: string }>();
		waybills.forEach((w) => {
			if (!companyMap.has(w.companyId)) {
				companyMap.set(w.companyId, { id: w.companyId, name: w.companyName });
			}
		});
		return Array.from(companyMap.values());
	}, [waybills, isEditMode]);

	const isMultipleCompanies = companies.length > 1;

	// 如果只有一家公司，自動選擇
	const effectiveCompanyId = isMultipleCompanies ? selectedCompanyId : companies[0]?.id || '';

	// 按公司分組託運單
	const waybillsByCompany = useMemo(() => {
		const grouped = new Map<string, Waybill[]>();
		waybills.forEach((w) => {
			const list = grouped.get(w.companyId) || [];
			list.push(w);
			grouped.set(w.companyId, list);
		});
		return grouped;
	}, [waybills]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('zh-TW', {
			style: 'currency',
			currency: 'TWD',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const handleSubmit = async () => {
		if (isEditMode && collectionRequest) {
			// 更新請款單
			const dto: UpdateCollectionRequestDto = {
				requestDate,
				notes: notes || undefined,
			};

			try {
				await updateMutation.mutateAsync({ id: collectionRequest.id, dto });
				onSuccess?.();
				onClose();
			} catch (error: any) {
				console.error('更新請款單失敗:', error);
				alert(error?.response?.data?.message || '更新請款單失敗，請稍後再試');
			}
		} else {
			// 建立請款單
			if (!effectiveCompanyId) {
				alert('請選擇請款對象公司');
				return;
			}

			const dto: CreateCollectionRequestDto = {
				requestDate,
				companyId: effectiveCompanyId,
				waybillIds: waybills.map((w) => w.id),
				notes: notes || undefined,
			};

			try {
				await createMutation.mutateAsync(dto);
				onSuccess?.();
				onClose();
				// 重置狀態
				setSelectedCompanyId('');
				setNotes('');
				setRequestDate(format(new Date(), 'yyyy-MM-dd'));
			} catch (error: any) {
				console.error('建立請款單失敗:', error);
				alert(error?.response?.data?.message || '建立請款單失敗，請稍後再試');
			}
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	// 渲染託運單表格行
	const renderWaybillRow = (waybill: Waybill | CollectionRequestWaybill, showCompany: boolean) => {
		const locations = ('loadingLocations' in waybill ? waybill.loadingLocations : []) || [];
		const filteredLocations = locations.filter((loc) => loc.from !== '空白' && loc.to !== '空白');
		const MAX_VISIBLE = 2;
		const visible = filteredLocations.slice(0, MAX_VISIBLE);
		const remaining = filteredLocations.length - visible.length;

		return (
			<TableRow key={waybill.id}>
				<TableCell>{format(new Date(waybill.date), 'yyyy/MM/dd')}</TableCell>
				<TableCell>
					<Stack direction="row" flexWrap="wrap" gap={0.5}>
						{visible.map((loc, idx) => (
							<Chip
								key={`${loc.from}-${loc.to}-${idx.toString()}`}
								label={`${loc.from} → ${loc.to}`}
								size="small"
								variant="outlined"
							/>
						))}
						{remaining > 0 && (
							<Tooltip
								title={
									<Stack sx={{ maxWidth: 360, p: 0.5 }}>
										{filteredLocations.map((loc, idx) => (
											<Typography key={`full-${`${loc.from}-${loc.to}-${idx}`}`} variant="body2">
												{loc.from} → {loc.to}
											</Typography>
										))}
									</Stack>
								}
								arrow
								placement="top"
							>
								<Chip label={`+${remaining}`} size="small" color="primary" />
							</Tooltip>
						)}
					</Stack>
				</TableCell>
				{showCompany && (
					<TableCell>
						{(waybill as Waybill).companyName || (waybill as CollectionRequestWaybill).companyName}
					</TableCell>
				)}
				<TableCell>{waybill.driverName}</TableCell>
				<TableCell align="right">{formatCurrency(waybill.fee)}</TableCell>
			</TableRow>
		);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>{isEditMode ? '編輯請款單' : '建立請款單'}</DialogTitle>
			<DialogContent>
				{isEditMode && isLoadingDetail ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<CircularProgress />
					</Box>
				) : (
					<Stack spacing={3} sx={{ mt: 1 }}>
						{/* 編輯模式：顯示請款單號和公司資訊 */}
						{isEditMode && collectionRequest && (
							<Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
								<Stack direction="row" spacing={4}>
									<Box>
										<Typography variant="caption" color="text.secondary">
											請款單號
										</Typography>
										<Typography variant="body1" fontWeight="bold">
											{collectionRequest.requestNumber}
										</Typography>
									</Box>
									<Box>
										<Typography variant="caption" color="text.secondary">
											公司名稱
										</Typography>
										<Typography variant="body1" fontWeight="bold">
											{collectionRequest.companyName}
										</Typography>
									</Box>
									<Box>
										<Typography variant="caption" color="text.secondary">
											託運單數量
										</Typography>
										<Typography variant="body2">{collectionRequest.waybillCount} 筆</Typography>
									</Box>
								</Stack>
							</Box>
						)}

						{/* 建立模式：多公司警告 */}
						{!isEditMode && isMultipleCompanies && (
							<Alert severity="warning">
								所選託運單包含 {companies.length} 家公司，請選擇向哪一家公司請款。
								<br />
								注意：總金額包含所有託運單，但請款對象為所選公司。
							</Alert>
						)}

						{/* 建立模式：公司選擇器（多公司時顯示） */}
						{!isEditMode && isMultipleCompanies && (
							<FormControl fullWidth required>
								<InputLabel>請款對象公司</InputLabel>
								<Select
									value={selectedCompanyId}
									label="請款對象公司"
									onChange={(e) => setSelectedCompanyId(e.target.value)}
								>
									{companies.map((company) => (
										<MenuItem key={company.id} value={company.id}>
											{company.name}（{waybillsByCompany.get(company.id)?.length || 0} 筆託運單）
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}

						{/* 建立模式：基本資訊（單一公司時顯示） */}
						{!isEditMode && !isMultipleCompanies && companies.length > 0 && (
							<Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
								<Typography variant="caption" color="text.secondary">
									公司名稱
								</Typography>
								<Typography variant="body1" fontWeight="bold" gutterBottom>
									{companies[0]?.name}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									託運單數量
								</Typography>
								<Typography variant="body2">{waybills.length} 筆</Typography>
							</Box>
						)}

						{/* 請款日期 */}
						<TextField
							label="請款日期"
							type="date"
							value={requestDate}
							onChange={(e) => setRequestDate(e.target.value)}
							fullWidth
							required
							InputLabelProps={{ shrink: true }}
						/>

						{/* 備註 */}
						<TextField
							label="備註"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							multiline
							rows={3}
							fullWidth
							placeholder="輸入請款相關備註資訊（選填）"
						/>

						{/* 託運單列表 */}
						<Box>
							<Typography variant="subtitle2" gutterBottom>
								託運單明細
							</Typography>
							<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell>日期</TableCell>
											<TableCell>地點</TableCell>
											{!isEditMode && isMultipleCompanies && <TableCell>所屬公司</TableCell>}
											<TableCell>司機</TableCell>
											<TableCell align="right">金額</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{isEditMode
											? // 編輯模式：顯示已綁定的託運單
												displayWaybills.map((waybill) => renderWaybillRow(waybill, false))
											: isMultipleCompanies
												? // 建立模式 - 多公司時按公司分組顯示
													companies.map((company) => {
														const companyWaybills = waybillsByCompany.get(company.id) || [];
														const companySubtotal = companyWaybills.reduce(
															(sum, w) => sum + w.fee,
															0,
														);
														return (
															<>
																{/* 公司分組標題 */}
																<TableRow key={`company-${company.id}`}>
																	<TableCell
																		colSpan={5}
																		sx={{
																			bgcolor: 'grey.100',
																			fontWeight: 'bold',
																			py: 1,
																		}}
																	>
																		{company.name}（{companyWaybills.length}{' '}
																		筆，小計：
																		{formatCurrency(companySubtotal)}）
																	</TableCell>
																</TableRow>
																{/* 該公司的託運單 */}
																{companyWaybills.map((waybill) => (
																	<TableRow
																		key={waybill.id}
																		sx={{
																			bgcolor:
																				selectedCompanyId === company.id
																					? 'primary.50'
																					: undefined,
																		}}
																	>
																		<TableCell>
																			{format(
																				new Date(waybill.date),
																				'yyyy/MM/dd',
																			)}
																		</TableCell>
																		<TableCell>
																			{(() => {
																				const locations = (
																					waybill.loadingLocations || []
																				).filter(
																					(loc) =>
																						loc.from !== '空白' &&
																						loc.to !== '空白',
																				);
																				const MAX_VISIBLE = 2;
																				const visible = locations.slice(
																					0,
																					MAX_VISIBLE,
																				);
																				const remaining =
																					locations.length - visible.length;
																				return (
																					<Stack
																						direction="row"
																						flexWrap="wrap"
																						gap={0.5}
																					>
																						{visible.map((loc, idx) => (
																							<Chip
																								key={`${loc.from}-${loc.to}-${idx.toString()}`}
																								label={`${loc.from} → ${loc.to}`}
																								size="small"
																								variant="outlined"
																							/>
																						))}
																						{remaining > 0 && (
																							<Tooltip
																								title={
																									<Stack
																										sx={{
																											maxWidth: 360,
																											p: 0.5,
																										}}
																									>
																										{locations.map(
																											(
																												loc,
																												idx,
																											) => (
																												<Typography
																													key={`full-${`${loc.from}-${loc.to}-${idx}`}`}
																													variant="body2"
																												>
																													{
																														loc.from
																													}{' '}
																													→{' '}
																													{
																														loc.to
																													}
																												</Typography>
																											),
																										)}
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
																				);
																			})()}
																		</TableCell>
																		<TableCell>{waybill.companyName}</TableCell>
																		<TableCell>{waybill.driverName}</TableCell>
																		<TableCell align="right">
																			{formatCurrency(waybill.fee)}
																		</TableCell>
																	</TableRow>
																))}
															</>
														);
													})
												: // 建立模式 - 單一公司時直接顯示
													waybills.map((waybill) => renderWaybillRow(waybill, false))}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>

						{/* 金額計算 */}
						<Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
							<Typography variant="subtitle2" gutterBottom>
								金額明細
							</Typography>
							<Divider sx={{ mb: 2 }} />
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between">
									<Typography>小計</Typography>
									<Typography>{formatCurrency(subtotal)}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography>稅額 (5%)</Typography>
									<Typography>{formatCurrency(taxAmount)}</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計</Typography>
									<Typography variant="h6" color="primary" fontWeight="bold">
										{formatCurrency(totalAmount)}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						{/* 提示訊息 */}
						{isEditMode ? (
							<Alert severity="info">編輯模式下僅可修改請款日期和備註，託運單內容不可變更。</Alert>
						) : (
							<Alert variant="filled" severity="info">
								確認後，系統將自動產生請款單號，並將所選的 {waybills.length}{' '}
								筆託運單標記為「已請款」狀態。
							</Alert>
						)}
					</Stack>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={isPending}>
					取消
				</Button>
				<Button
					variant="contained"
					color="primary"
					onClick={handleSubmit}
					disabled={
						isPending ||
						!requestDate ||
						(isEditMode && isLoadingDetail) ||
						(!isEditMode && waybills.length === 0) ||
						(!isEditMode && !effectiveCompanyId) ||
						(!isEditMode && isMultipleCompanies && !selectedCompanyId)
					}
				>
					{isPending ? '處理中...' : isEditMode ? '確認更新' : '確認建立'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
