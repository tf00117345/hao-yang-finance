import React, { useCallback, useMemo, useState } from 'react';

import ClearIcon from '@mui/icons-material/Clear';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
	Paper,
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

import ConfirmDialog from '../../../../component/ConfirmDialog/ConfirmDialog';
import { useDeleteInvoiceMutation, useResolveOutstandingBalanceMutation } from '../../api/mutation';
import { useInvoicesQuery, useOutstandingBalancesByCompanyQuery } from '../../api/query';
import { Invoice } from '../../types/invoice.type';
import InvoicedWaybillSubTable from '../InvoiceWaybillSubTable/InvoiceWaybillSubTable';
import { MarkInvoicePaidDialog } from '../shared/MarkInvoicePaidDialog';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface CompanyGroup {
	companyName: string;
	companyId: string;
	totalAmount: number;
	invoiceCount: number;
	invoices: Invoice[];
}

interface AccountsReceivableSummaryProps {
	onEdit?: (invoice: Invoice) => void;
}

export function AccountsReceivableSummary({ onEdit }: AccountsReceivableSummaryProps) {
	const { data: invoices = [], isPending } = useInvoicesQuery({ status: 'issued' });
	const { data: outstandingByCompany = [] } = useOutstandingBalancesByCompanyQuery();
	const deleteMutation = useDeleteInvoiceMutation();
	const resolveMutation = useResolveOutstandingBalanceMutation();

	// 建立公司欠款 Map 方便查詢
	const outstandingMap = useMemo(() => {
		const map = new Map<string, { total: number; records: typeof outstandingByCompany[0]['records'] }>();
		for (const item of outstandingByCompany) {
			map.set(item.companyId, { total: item.totalOutstanding, records: item.records });
		}
		return map;
	}, [outstandingByCompany]);

	const totalOutstandingAmount = useMemo(
		() => outstandingByCompany.reduce((sum, item) => sum + item.totalOutstanding, 0),
		[outstandingByCompany],
	);

	// 按公司分組（包含只有欠款但沒有未收款發票的公司）
	const companyGroups = useMemo(() => {
		const map = new Map<string, { companyId: string; companyName: string; invoices: Invoice[] }>();
		for (const inv of invoices) {
			const existing = map.get(inv.companyId);
			if (existing) {
				existing.invoices.push(inv);
			} else {
				map.set(inv.companyId, { companyId: inv.companyId, companyName: inv.companyName, invoices: [inv] });
			}
		}

		// 合併只有欠款但沒有未收款發票的公司
		for (const ob of outstandingByCompany) {
			if (!map.has(ob.companyId)) {
				map.set(ob.companyId, { companyId: ob.companyId, companyName: ob.companyName, invoices: [] });
			}
		}

		const groups: CompanyGroup[] = [];
		for (const [, { companyId, companyName, invoices: companyInvoices }] of map) {
			groups.push({
				companyName,
				companyId,
				totalAmount: companyInvoices.reduce((sum, inv) => sum + inv.total, 0),
				invoiceCount: companyInvoices.length,
				invoices: companyInvoices,
			});
		}
		groups.sort((a, b) => a.companyName.localeCompare(b.companyName, 'zh-TW'));
		return groups;
	}, [invoices, outstandingByCompany]);

	// 搜尋篩選
	const [searchText, setSearchText] = useState('');

	const filteredGroups = useMemo(() => {
		if (!searchText.trim()) return companyGroups;
		const keyword = searchText.trim().toLowerCase();
		return companyGroups.filter((g) => g.companyName.toLowerCase().includes(keyword));
	}, [companyGroups, searchText]);

	const grandTotal = useMemo(
		() => filteredGroups.reduce((sum, g) => sum + g.totalAmount, 0),
		[filteredGroups],
	);

	// 展開狀態
	const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
	const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());

	// 對話框狀態
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [deleteConfirmState, setDeleteConfirmState] = useState<{
		open: boolean;
		invoice: Invoice | null;
	}>({ open: false, invoice: null });

	const toggleCompany = useCallback((companyName: string) => {
		setExpandedCompanies((prev) => {
			const next = new Set(prev);
			if (next.has(companyName)) {
				next.delete(companyName);
			} else {
				next.add(companyName);
			}
			return next;
		});
	}, []);

	const toggleInvoice = useCallback((invoiceId: string) => {
		setExpandedInvoices((prev) => {
			const next = new Set(prev);
			if (next.has(invoiceId)) {
				next.delete(invoiceId);
			} else {
				next.add(invoiceId);
			}
			return next;
		});
	}, []);

	// 操作處理
	const handleViewInvoice = useCallback((invoice: Invoice) => {
		setViewingInvoice(invoice);
		setViewDialogOpen(true);
	}, []);

	const handleMarkPaid = useCallback((invoice: Invoice) => {
		setSelectedInvoice(invoice);
		setPaymentDialogOpen(true);
	}, []);

	const handleEditInvoice = useCallback(
		(invoice: Invoice) => {
			onEdit?.(invoice);
		},
		[onEdit],
	);

	const handleDeleteInvoice = useCallback((invoice: Invoice) => {
		setDeleteConfirmState({ open: true, invoice });
	}, []);

	const confirmDelete = useCallback(() => {
		if (deleteConfirmState.invoice) {
			deleteMutation.mutate(deleteConfirmState.invoice.id, {
				onSettled: () => setDeleteConfirmState({ open: false, invoice: null }),
			});
		}
	}, [deleteConfirmState, deleteMutation]);

	if (isPending) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
					gap: 2,
				}}
			>
				<CircularProgress size={48} />
				<Typography variant="body2" color="text.secondary">
					載入中...
				</Typography>
			</Box>
		);
	}

	if (companyGroups.length === 0) {
		return (
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
				}}
			>
				<Typography variant="body1" color="text.secondary">
					目前沒有未收款的發票或欠款記錄
				</Typography>
			</Box>
		);
	}

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			{/* 標題 + 搜尋 + 統計 */}
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
				<Stack direction="row" spacing={2} alignItems="center">
					<Typography sx={{ px: 2 }} variant="h6" component="div">
						未收款彙總
					</Typography>
					<TextField
						size="small"
						placeholder="搜尋客戶名稱..."
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						sx={{ width: 250 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: '1.2rem', color: 'text.disabled' }} />
								</InputAdornment>
							),
							endAdornment: searchText && (
								<InputAdornment position="end">
									<IconButton size="small" onClick={() => setSearchText('')}>
										<ClearIcon sx={{ fontSize: '1rem' }} />
									</IconButton>
								</InputAdornment>
							),
						}}
					/>
				</Stack>
				<Stack direction="row" spacing={2} sx={{ px: 2 }}>
					<Typography variant="body2" color="text.secondary">
						未收款公司數：<strong>{filteredGroups.length}</strong>
					</Typography>
					<Typography variant="body2" color="error">
						未收款總額：<strong>${grandTotal.toLocaleString()}</strong>
					</Typography>
					{totalOutstandingAmount > 0 && (
						<Typography variant="body2" color="error" fontWeight="bold">
							歷史欠款：${totalOutstandingAmount.toLocaleString()}
						</Typography>
					)}
				</Stack>
			</Stack>

			{/* 公司分組表格 */}
			<TableContainer
				component={Paper}
				sx={{ flex: 1, overflow: 'auto', border: '1px solid #E0E0E0' }}
			>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<StyledTableCell sx={{ width: 60 }} />
							<StyledTableCell>公司名稱</StyledTableCell>
							<StyledTableCell sx={{ width: 120 }} align="center">
								發票數
							</StyledTableCell>
							<StyledTableCell sx={{ width: 180 }} align="right">
								未收總額
							</StyledTableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredGroups.map((company) => (
							<React.Fragment key={company.companyId}>
								{/* Level 1: 公司行 */}
								<StyledTableRow
									onClick={() => toggleCompany(company.companyName)}
									sx={{ cursor: 'pointer' }}
								>
									<StyledTableCell>
										<IconButton size="small">
											{expandedCompanies.has(company.companyName) ? (
												<ExpandMoreIcon />
											) : (
												<ChevronRightIcon />
											)}
										</IconButton>
									</StyledTableCell>
									<StyledTableCell>
										<Stack direction="row" spacing={1} alignItems="center">
											<strong>{company.companyName}</strong>
											{(outstandingMap.get(company.companyId)?.total ?? 0) > 0 && (
												<Chip
													label={`欠款: $${outstandingMap.get(company.companyId)!.total.toLocaleString()}`}
													color="error"
													size="small"
												/>
											)}
										</Stack>
									</StyledTableCell>
									<StyledTableCell align="center">
										<Chip
											label={`${company.invoiceCount} 張`}
											size="small"
											variant="outlined"
										/>
									</StyledTableCell>
									<StyledTableCell align="right">
										<Typography variant="body2" fontWeight="bold" color="error">
											${company.totalAmount.toLocaleString()}
										</Typography>
									</StyledTableCell>
								</StyledTableRow>

								{/* Level 2: 展開的發票清單 */}
								<TableRow>
									<TableCell
										colSpan={4}
										sx={{
											p: 0,
											borderBottom: expandedCompanies.has(company.companyName)
												? undefined
												: 'none',
										}}
									>
										<Collapse
											in={expandedCompanies.has(company.companyName)}
											unmountOnExit
										>
											<Box sx={{ m: 2 }}>
												<Table size="small" sx={{ border: '1px solid #E0E0E0' }}>
													<TableHead>
														<TableRow>
															<StyledTableCell sx={{ width: 60 }} />
															<StyledTableCell sx={{ minWidth: 140 }}>
																發票號碼
															</StyledTableCell>
															<StyledTableCell sx={{ minWidth: 140 }}>
																額外費用總額
															</StyledTableCell>
															<StyledTableCell sx={{ minWidth: 140 }}>
																發票金額
															</StyledTableCell>
															<StyledTableCell sx={{ minWidth: 140 }}>
																應收帳款
															</StyledTableCell>
															<StyledTableCell
																sx={{ minWidth: 240 }}
																align="center"
															>
																操作
															</StyledTableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{company.invoices.map((invoice) => (
															<React.Fragment key={invoice.id}>
																{/* 發票行 */}
																<StyledTableRow>
																	<TableCell sx={{ width: 60 }}>
																		{invoice.waybills &&
																			invoice.waybills.length > 0 && (
																				<IconButton
																					size="small"
																					onClick={(e) => {
																						e.stopPropagation();
																						toggleInvoice(invoice.id);
																					}}
																				>
																					{expandedInvoices.has(
																						invoice.id,
																					) ? (
																						<ExpandMoreIcon fontSize="small" />
																					) : (
																						<ChevronRightIcon fontSize="small" />
																					)}
																				</IconButton>
																			)}
																	</TableCell>
																	<TableCell>
																		{invoice.invoiceNumber}
																	</TableCell>
																	<TableCell>
																		$
																		{invoice.extraExpenses
																			?.reduce(
																				(sum, e) => sum + e.fee,
																				0,
																			)
																			.toLocaleString()}
																	</TableCell>
																	<TableCell>
																		$
																		{(
																			invoice.waybills?.reduce(
																				(sum, w) =>
																					sum + (w.fee || 0),
																				0,
																			) + invoice.tax
																		).toLocaleString()}
																	</TableCell>
																	<TableCell>
																		<strong>
																			${invoice.total.toLocaleString()}
																		</strong>
																	</TableCell>
																	<TableCell align="center">
																		<Stack
																			direction="row"
																			spacing={1}
																			justifyContent="center"
																		>
																			<Button
																				size="small"
																				variant="outlined"
																				onClick={() =>
																					handleViewInvoice(
																						invoice,
																					)
																				}
																			>
																				查看
																			</Button>
																			<Button
																				size="small"
																				variant="contained"
																				color="success"
																				onClick={() =>
																					handleMarkPaid(invoice)
																				}
																			>
																				收款
																			</Button>
																			<Button
																				size="small"
																				variant="contained"
																				onClick={() =>
																					handleEditInvoice(
																						invoice,
																					)
																				}
																			>
																				編輯
																			</Button>
																			<Button
																				size="small"
																				variant="contained"
																				color="error"
																				onClick={() =>
																					handleDeleteInvoice(
																						invoice,
																					)
																				}
																			>
																				刪除
																			</Button>
																		</Stack>
																	</TableCell>
																</StyledTableRow>

																{/* Level 3: 展開的託運單明細 */}
																{expandedInvoices.has(invoice.id) && (
																	<TableRow>
																		<TableCell
																			colSpan={6}
																			sx={{ p: 0, border: 0 }}
																		>
																			<Collapse
																				in={expandedInvoices.has(
																					invoice.id,
																				)}
																				timeout="auto"
																				unmountOnExit
																			>
																				<InvoicedWaybillSubTable
																					invoice={invoice}
																				/>
																			</Collapse>
																		</TableCell>
																	</TableRow>
																)}
															</React.Fragment>
														))}
													</TableBody>
												</Table>

												{/* 欠款記錄區塊 */}
												{(outstandingMap.get(company.companyId)?.records?.length ?? 0) > 0 && (
													<Box sx={{ mt: 2 }}>
														<Typography variant="subtitle2" color="error" gutterBottom>
															歷史欠款記錄
														</Typography>
														<Table size="small" sx={{ border: '1px solid #E0E0E0' }}>
															<TableHead>
																<TableRow>
																	<StyledTableCell>來源發票</StyledTableCell>
																	<StyledTableCell align="right">欠款金額</StyledTableCell>
																	<StyledTableCell>備註</StyledTableCell>
																	<StyledTableCell>建立日期</StyledTableCell>
																	<StyledTableCell align="center" sx={{ width: 120 }}>操作</StyledTableCell>
																</TableRow>
															</TableHead>
															<TableBody>
																{outstandingMap.get(company.companyId)!.records.map((record) => (
																	<StyledTableRow key={record.id}>
																		<TableCell>{record.invoiceNumber}</TableCell>
																		<TableCell align="right">
																			<Typography variant="body2" color="error" fontWeight="bold">
																				${record.amount.toLocaleString()}
																			</Typography>
																		</TableCell>
																		<TableCell>{record.note || '-'}</TableCell>
																		<TableCell>
																			{new Date(record.createdAt).toLocaleDateString('zh-TW')}
																		</TableCell>
																		<TableCell align="center">
																			<Button
																				size="small"
																				variant="contained"
																				color="success"
																				disabled={resolveMutation.isPending}
																				onClick={(e) => {
																					e.stopPropagation();
																					resolveMutation.mutate(record.id);
																				}}
																			>
																				已補齊
																			</Button>
																		</TableCell>
																	</StyledTableRow>
																))}
															</TableBody>
														</Table>
													</Box>
												)}
											</Box>
										</Collapse>
									</TableCell>
								</TableRow>
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* 收款對話框 */}
			<MarkInvoicePaidDialog
				open={paymentDialogOpen}
				invoice={selectedInvoice}
				onClose={() => {
					setPaymentDialogOpen(false);
					setSelectedInvoice(null);
				}}
			/>

			{/* 刪除確認對話框 */}
			<ConfirmDialog
				open={deleteConfirmState.open}
				title="確認刪除發票？"
				description={`發票號碼：${deleteConfirmState.invoice?.invoiceNumber}。刪除後將無法復原。仍要刪除嗎？`}
				confirmText="刪除"
				confirmColor="error"
				isConfirming={deleteMutation.isPending}
				onClose={() => {
					if (!deleteMutation.isPending) {
						setDeleteConfirmState({ open: false, invoice: null });
					}
				}}
				onConfirm={confirmDelete}
			/>

			{/* 查看發票詳情對話框 */}
			<Dialog
				open={viewDialogOpen}
				onClose={() => setViewDialogOpen(false)}
				maxWidth="md"
				fullWidth
				PaperProps={{ sx: { minHeight: '70vh', maxHeight: '90vh' } }}
			>
				<DialogTitle>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="h6">發票詳情</Typography>
						<Chip label="未收款" color="error" size="small" />
					</Stack>
				</DialogTitle>
				<DialogContent dividers>
					{viewingInvoice && (
						<Stack spacing={3}>
							{/* 基本資訊 */}
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									基本資訊
								</Typography>
								<Stack spacing={1.5}>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											發票號碼:
										</Typography>
										<Typography variant="body2" fontWeight="medium">
											{viewingInvoice.invoiceNumber}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											開立日期:
										</Typography>
										<Typography variant="body2">
											{new Date(viewingInvoice.date).toLocaleDateString('zh-TW')}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											客戶名稱:
										</Typography>
										<Typography variant="body2">
											{viewingInvoice.companyName}
										</Typography>
									</Stack>
									{viewingInvoice.notes && (
										<Stack direction="row" spacing={2}>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ minWidth: 100 }}
											>
												備註:
											</Typography>
											<Typography variant="body2">
												{viewingInvoice.notes}
											</Typography>
										</Stack>
									)}
								</Stack>
							</Box>

							{/* 金額資訊 */}
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									金額資訊
								</Typography>
								<Stack spacing={1.5}>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											小計:
										</Typography>
										<Typography variant="body2">
											${viewingInvoice.subtotal.toLocaleString()}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											稅率:
										</Typography>
										<Typography variant="body2">
											{viewingInvoice.taxRate}%
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											稅額:
										</Typography>
										<Typography variant="body2">
											${viewingInvoice.tax.toLocaleString()}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											總計:
										</Typography>
										<Typography
											variant="body2"
											fontWeight="bold"
											fontSize="1.1rem"
										>
											${viewingInvoice.total.toLocaleString()}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											額外費用含稅:
										</Typography>
										<Typography variant="body2">
											{viewingInvoice.extraExpensesIncludeTax ? '是' : '否'}
										</Typography>
									</Stack>
								</Stack>
							</Box>

							{/* 託運單列表 */}
							{viewingInvoice.waybills && viewingInvoice.waybills.length > 0 && (
								<Box>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										託運單明細 ({viewingInvoice.waybills.length} 筆)
									</Typography>
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>
												<TableRow>
													<StyledTableCell>日期</StyledTableCell>
													<StyledTableCell>地點</StyledTableCell>
													<StyledTableCell>司機</StyledTableCell>
													<StyledTableCell align="right">
														金額
													</StyledTableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{viewingInvoice.waybills
													.sort(
														(a, b) =>
															new Date(a.date).getTime() -
															new Date(b.date).getTime(),
													)
													.map((waybill) => {
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
															<TableRow key={waybill.waybillId}>
																<TableCell>
																	{new Date(
																		waybill.date,
																	).toLocaleDateString('zh-TW')}
																</TableCell>
																<TableCell>
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
																									key={`full-${loc.from}-${loc.to}-${idx}`}
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
																</TableCell>
																<TableCell>
																	{waybill.driverName}
																</TableCell>
																<TableCell align="right">
																	${waybill.fee.toLocaleString()}
																</TableCell>
															</TableRow>
														);
													})}
												<TableRow>
													<TableCell colSpan={3} align="right">
														<Typography
															variant="body2"
															fontWeight="bold"
														>
															託運單小計:
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography
															variant="body2"
															fontWeight="bold"
														>
															$
															{viewingInvoice.waybills
																.reduce(
																	(sum, w) => sum + w.fee,
																	0,
																)
																.toLocaleString()}
														</Typography>
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</TableContainer>
								</Box>
							)}

							{/* 額外費用列表 */}
							{viewingInvoice.extraExpenses &&
								viewingInvoice.extraExpenses.length > 0 && (
									<Box>
										<Typography
											variant="subtitle1"
											fontWeight="bold"
											gutterBottom
										>
											額外費用明細 ({viewingInvoice.extraExpenses.length} 筆)
										</Typography>
										<TableContainer component={Paper} variant="outlined">
											<Table size="small">
												<TableHead>
													<TableRow>
														<StyledTableCell>項目</StyledTableCell>
														<StyledTableCell>備註</StyledTableCell>
														<StyledTableCell align="right">
															金額
														</StyledTableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{viewingInvoice.extraExpenses.map((expense) => (
														<TableRow key={expense.extraExpenseId}>
															<TableCell>{expense.item}</TableCell>
															<TableCell>
																{expense.notes || '-'}
															</TableCell>
															<TableCell align="right">
																${expense.fee.toLocaleString()}
															</TableCell>
														</TableRow>
													))}
													<TableRow>
														<TableCell colSpan={2} align="right">
															<Typography
																variant="body2"
																fontWeight="bold"
															>
																額外費用小計:
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography
																variant="body2"
																fontWeight="bold"
															>
																$
																{viewingInvoice.extraExpenses
																	.reduce(
																		(sum, e) => sum + e.fee,
																		0,
																	)
																	.toLocaleString()}
															</Typography>
														</TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</TableContainer>
									</Box>
								)}

							{/* 時間資訊 */}
							<Box>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									時間資訊
								</Typography>
								<Stack spacing={1.5}>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											建立時間:
										</Typography>
										<Typography variant="body2">
											{new Date(viewingInvoice.createdAt).toLocaleString(
												'zh-TW',
											)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2}>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ minWidth: 100 }}
										>
											更新時間:
										</Typography>
										<Typography variant="body2">
											{new Date(viewingInvoice.updatedAt).toLocaleString(
												'zh-TW',
											)}
										</Typography>
									</Stack>
								</Stack>
							</Box>
						</Stack>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setViewDialogOpen(false)}>關閉</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
