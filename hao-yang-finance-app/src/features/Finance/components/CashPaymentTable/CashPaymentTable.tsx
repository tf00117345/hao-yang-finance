import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ArrowDownward, ArrowUpward, UnfoldMore } from '@mui/icons-material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import RestoreIcon from '@mui/icons-material/Restore';
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';

import {
	useMarkWaybillAsPaidWithTaxMutation,
	useMarkWaybillAsUnpaidWithTaxMutation,
	useRestoreWaybillMutation,
	useRestoreWaybillsBatchMutation,
	useTogglePaymentStatusMutation,
	useUpdatePaymentNotesMutation,
} from '../../../Waybill/api/mutation';
import { WaybillStatus, WaybillStatusRules } from '../../../Waybill/types/waybill-status.types';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useCashPaymentTable } from '../../hooks/useCashPaymentTable';
import { useStickyFilterTop } from '../../hooks/useStickyFilterTop';
import { MarkPaidDialog } from '../MarkPaidDialog/MarkPaidDialog';
import { SmartFilterInput } from '../shared/SmartFilterInput';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface CashPaymentTableProps {
	waybills: Waybill[];
}

export function CashPaymentTable({ waybills }: CashPaymentTableProps) {
	const isMountedRef = useRef(false);
	const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
	const [editNotesDialogOpen, setEditNotesDialogOpen] = useState(false);
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
	const [editingWaybill, setEditingWaybill] = useState<Waybill | null>(null);
	const [notes, setNotes] = useState('');
	const [processingMarkPaid, setProcessingMarkPaid] = useState(false);
	const [processingNotes, setProcessingNotes] = useState(false);
	const [processingRestore, setProcessingRestore] = useState(false);
	const { tableHeadRef, filterRowRef, filterTop } = useStickyFilterTop();

	const { table, columnFilters, setColumnFilters } = useCashPaymentTable(waybills);
	const markAsUnpaidWithTaxMutation = useMarkWaybillAsUnpaidWithTaxMutation();
	const markAsPaidWithTaxMutation = useMarkWaybillAsPaidWithTaxMutation();
	const togglePaymentStatusMutation = useTogglePaymentStatusMutation();
	const updatePaymentNotesMutation = useUpdatePaymentNotesMutation();
	const restoreWaybillMutation = useRestoreWaybillMutation();
	const restoreWaybillsBatchMutation = useRestoreWaybillsBatchMutation();

	// Track component mount status
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// 處理篩選變更
	const handleFilterChange = useCallback(
		(columnId: string, value: string) => {
			if (!isMountedRef.current) return;
			setColumnFilters((prev) =>
				prev.filter((filter) => filter.id !== columnId).concat(value ? [{ id: columnId, value }] : []),
			);
		},
		[setColumnFilters],
	);

	// 清除特定欄位的篩選
	const clearFilter = useCallback(
		(columnId: string) => {
			if (!isMountedRef.current) return;
			setColumnFilters((prev) => prev.filter((filter) => filter.id !== columnId));
		},
		[setColumnFilters],
	);

	// 取得特定欄位的篩選值
	const getFilterValue = useCallback(
		(columnId: string) => {
			return columnFilters.find((filter) => filter.id === columnId)?.value || '';
		},
		[columnFilters],
	);

	// 處理切換收款狀態
	const handleTogglePaymentStatus = () => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			// eslint-disable-next-line no-alert
			alert('請先選擇一筆資料');
			return;
		}
		if (selected.length > 1) {
			// eslint-disable-next-line no-alert
			alert('切換收款狀態僅支援單筆操作，請只選擇一筆資料');
			return;
		}

		const waybill = selected[0];
		if (!WaybillStatusRules.canTogglePaymentStatus(waybill.status as WaybillStatus)) {
			// eslint-disable-next-line no-alert
			alert('此託運單狀態無法切換收款狀態');
			return;
		}

		// 如果是未收款狀態，需要開啟對話框輸入收款資訊
		if (waybill.status === WaybillStatus.NEED_TAX_UNPAID) {
			setEditingWaybill(waybill);
			setMarkPaidDialogOpen(true);
		} else {
			// 如果是已收款狀態，直接切換為未收款
			togglePaymentStatusMutation.mutateAsync({ waybillId: waybill.id });
			table.resetRowSelection();
		}
	};

	// 處理編輯收款備註
	const handleEditNotes = (waybill: Waybill) => {
		setEditingWaybill(waybill);
		setNotes(waybill.paymentNotes || '');
		setEditNotesDialogOpen(true);
	};

	// 處理還原為待開發票
	const handleOpenRestoreDialog = () => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			// eslint-disable-next-line no-alert
			alert('請先選擇資料');
			return;
		}

		setRestoreDialogOpen(true);
	};

	// 確認標記為已收款
	const handleConfirmMarkPaid = async (params: {
		paymentNotes: string;
		paymentDate: string;
		paymentMethod: string;
	}) => {
		if (!editingWaybill) return;

		setProcessingMarkPaid(true);

		try {
			if (editingWaybill.status === WaybillStatus.PENDING) {
				// 從待開發票直接標記為已收款
				await markAsPaidWithTaxMutation.mutateAsync({
					waybillId: editingWaybill.id,
					...params,
				});
			} else {
				// 從未收款切換為已收款
				await togglePaymentStatusMutation.mutateAsync({
					waybillId: editingWaybill.id,
					...params,
				});
			}

			setMarkPaidDialogOpen(false);
			setEditingWaybill(null);
			table.resetRowSelection();
		} catch (error) {
			console.error('標記為已收款失敗:', error);
		} finally {
			setProcessingMarkPaid(false);
		}
	};

	// 更新收款備註
	const handleUpdateNotes = async () => {
		if (!editingWaybill) return;

		setProcessingNotes(true);

		try {
			await updatePaymentNotesMutation.mutateAsync({
				waybillId: editingWaybill.id,
				paymentNotes: notes.trim(),
			});

			setEditNotesDialogOpen(false);
			setEditingWaybill(null);
			setNotes('');
		} catch (error) {
			console.error('更新收款備註失敗:', error);
		} finally {
			setProcessingNotes(false);
		}
	};

	// 確認還原為待開發票
	const handleConfirmRestore = async () => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) return;

		setProcessingRestore(true);

		try {
			if (selected.length === 1) {
				await restoreWaybillMutation.mutateAsync(selected[0].id);
			} else {
				await restoreWaybillsBatchMutation.mutateAsync(selected.map((w) => w.id));
			}

			setRestoreDialogOpen(false);
			table.resetRowSelection();
		} catch (error) {
			console.error('還原為待開發票失敗:', error);
		} finally {
			setProcessingRestore(false);
		}
	};

	// 分組與排序處理
	const handleGrouping = useCallback((e: React.MouseEvent, column: any) => {
		column.toggleGrouping();
		e.stopPropagation();
	}, []);

	const handleSorting = useCallback((e: React.MouseEvent, column: any) => {
		column.toggleSorting();
		e.stopPropagation();
	}, []);

	// 為表頭創建穩定的處理函數
	const headerHandlers = useMemo(() => {
		return table.getHeaderGroups().reduce(
			(acc, headerGroup) => {
				headerGroup.headers.forEach((header) => {
					if (header.column.getCanSort()) {
						acc[`sort-${header.id}`] = (e: React.MouseEvent) => handleSorting(e, header.column);
					}
					if (header.column.getCanGroup()) {
						acc[`group-${header.id}`] = (e: React.MouseEvent) => handleGrouping(e, header.column);
					}
				});
				return acc;
			},
			{} as Record<string, (e: React.MouseEvent) => void>,
		);
	}, [table, handleSorting, handleGrouping]);

	// 為行創建穩定的點擊處理函數
	const rowHandlers = useMemo(() => {
		return table.getRowModel().rows.reduce(
			(acc, row) => {
				acc[row.id] = () => row.getCanSelect() && row.toggleSelected();
				return acc;
			},
			{} as Record<string, () => void>,
		);
	}, [table]);

	// 渲染單元格內容的函數
	const renderCellContent = useCallback((cell: any, row: any) => {
		if (cell.column.id === 'select') {
			return (
				<Checkbox
					sx={{ p: 0 }}
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					onChange={row.getToggleSelectedHandler()}
					onClick={(e) => e.stopPropagation()}
				/>
			);
		}

		// 加入操作欄
		if (cell.column.id === 'actions') {
			const waybill = row.original as Waybill;
			return (
				<Stack direction="row" spacing={0.5}>
					{WaybillStatusRules.canEditPaymentNotes(waybill.status as WaybillStatus) && (
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								handleEditNotes(waybill);
							}}
							title="編輯收款備註"
						>
							<EditIcon fontSize="small" />
						</IconButton>
					)}
				</Stack>
			);
		}

		if (cell.getIsGrouped()) {
			return (
				<Stack direction="row" alignItems="center" spacing={1}>
					<IconButton
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							row.getToggleExpandedHandler()();
						}}
						sx={{
							cursor: row.getCanExpand() ? 'pointer' : 'default',
						}}
					>
						{row.getIsExpanded() ? (
							<ExpandMoreIcon fontSize="small" />
						) : (
							<ChevronRightIcon fontSize="small" />
						)}
					</IconButton>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
					<span>({row.subRows.length})</span>
				</Stack>
			);
		}

		if (cell.getIsAggregated()) {
			return flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext());
		}

		if (cell.getIsPlaceholder()) {
			return null;
		}

		return flexRender(cell.column.columnDef.cell, cell.getContext());
	}, []);

	const selectedCount = table.getSelectedRowModel().rows.length;
	const selectedWaybills = table.getSelectedRowModel().rows.map((row) => row.original);
	const canToggle =
		selectedCount === 1 && WaybillStatusRules.canTogglePaymentStatus(selectedWaybills[0]?.status as WaybillStatus);

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
				<Stack direction="row" spacing={1}>
					<Typography sx={{ flex: '1 1 100%', px: 2 }} variant="h6" component="div">
						公司應收款項之貨運單
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
					<Button
						sx={{ width: '150px' }}
						size="small"
						variant="contained"
						color="primary"
						startIcon={<RestoreIcon />}
						onClick={handleOpenRestoreDialog}
						disabled={selectedCount === 0}
					>
						還原成待開發票
					</Button>
					{canToggle && (
						<Button
							sx={{ width: '150px' }}
							size="small"
							variant="contained"
							color={
								selectedWaybills[0]?.status === WaybillStatus.NEED_TAX_UNPAID ? 'success' : 'warning'
							}
							startIcon={
								selectedWaybills[0]?.status === WaybillStatus.NEED_TAX_UNPAID ? (
									<CheckCircleIcon />
								) : (
									<CancelIcon />
								)
							}
							onClick={handleTogglePaymentStatus}
						>
							{selectedWaybills[0]?.status === WaybillStatus.NEED_TAX_UNPAID
								? '標記為已收款'
								: '返回為未收款'}
						</Button>
					)}
				</Stack>
			</Stack>
			<TableContainer
				component={Paper}
				sx={{
					flex: 1,
					overflow: 'auto',
					border: '1px solid #E0E0E0',
					display: 'block',
				}}
			>
				<Table stickyHeader sx={{ tableLayout: 'fixed' }}>
					<TableHead ref={tableHeadRef}>
						{/* 表頭行 */}
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<StyledTableCell
										size="small"
										key={header.id}
										colSpan={header.colSpan}
										onClick={
											header.column.getCanSort() ? headerHandlers[`sort-${header.id}`] : undefined
										}
										sx={{
											cursor: header.column.getCanSort() ? 'pointer' : 'default',
											width: header.getSize(),
											minWidth: header.column.columnDef.minSize || 120,
											userSelect: 'none',
											'&:hover': header.column.getCanSort()
												? { backgroundColor: 'action.hover' }
												: {},
										}}
									>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												position: 'relative',
											}}
										>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
												{header.column.getCanGroup() && (
													<IconButton
														size="small"
														sx={{ color: 'inherit' }}
														onClick={headerHandlers[`group-${header.id}`]}
													>
														{header.column.getIsGrouped() ? (
															<CancelIcon fontSize="small" sx={{ color: 'red' }} />
														) : (
															<GroupIcon fontSize="small" sx={{ color: '#2196F3' }} />
														)}
													</IconButton>
												)}
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}

												{/* 排序指示器 */}
												{header.column.getCanSort() && (
													<Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
														{header.column.getIsSorted() === 'asc' && (
															<ArrowUpward
																sx={{ fontSize: '0.875rem', color: 'primary.main' }}
															/>
														)}
														{header.column.getIsSorted() === 'desc' && (
															<ArrowDownward
																sx={{ fontSize: '0.875rem', color: 'primary.main' }}
															/>
														)}
														{!header.column.getIsSorted() && (
															<UnfoldMore
																sx={{ fontSize: '0.875rem', color: 'text.disabled' }}
															/>
														)}
													</Box>
												)}
											</Box>

											{/* 列寬調整器 */}
											{header.column.getCanResize() && (
												<Box
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													sx={{
														position: 'absolute',
														right: 0,
														top: 0,
														height: '100%',
														width: '5px',
														cursor: 'col-resize',
														userSelect: 'none',
														touchAction: 'none',
														backgroundColor: header.column.getIsResizing()
															? 'primary.main'
															: 'transparent',
														'&:hover': {
															backgroundColor: 'primary.light',
														},
													}}
												/>
											)}
										</Box>
									</StyledTableCell>
								))}
							</TableRow>
						))}

						{/* 篩選行 */}
						<TableRow ref={filterRowRef}>
							{table.getHeaderGroups()[0].headers.map((header, index) => (
								<TableCell
									key={`filter-${header.id}-${index.toString()}`}
									size="small"
									sx={{
										py: 1,
										px: 1,
										position: 'sticky',
										top: filterTop,
										zIndex: 1,
										backgroundColor: '#FAFAFB',
									}}
								>
									{header.column.getCanFilter() && (
										<SmartFilterInput
											columnId={header.id}
											columnHeader={header.column.columnDef.header as string}
											value={getFilterValue(header.id) as string}
											onChange={(value) => handleFilterChange(header.id, value)}
											onClear={() => clearFilter(header.id)}
											entityType={header.id === 'status' ? 'waybill' : undefined}
										/>
									)}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<StyledTableRow
								key={row.id}
								onClick={rowHandlers[row.id]}
								sx={{
									cursor: row.getCanSelect() ? 'pointer' : 'default',
									bgcolor: row.getIsSelected() ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
								}}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										size="small"
										key={cell.id}
										sx={{
											width: cell.column.getSize(),
											maxWidth: cell.column.getSize(),
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{renderCellContent(cell, row)}
									</TableCell>
								))}
							</StyledTableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* 標記為已收款對話框 */}
			<MarkPaidDialog
				open={markPaidDialogOpen}
				waybill={editingWaybill}
				onClose={() => {
					setMarkPaidDialogOpen(false);
					setEditingWaybill(null);
				}}
				onConfirm={handleConfirmMarkPaid}
				processing={processingMarkPaid}
			/>

			{/* 編輯收款備註對話框 */}
			<Dialog
				open={editNotesDialogOpen}
				onClose={() => setEditNotesDialogOpen(false)}
				aria-labelledby="edit-notes-dialog-title"
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle id="edit-notes-dialog-title">編輯收款備註</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="收款備註"
						fullWidth
						multiline
						rows={4}
						variant="outlined"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="請輸入收款相關備註..."
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditNotesDialogOpen(false)} color="primary">
						取消
					</Button>
					<Button onClick={handleUpdateNotes} color="primary" variant="contained" disabled={processingNotes}>
						{processingNotes ? <CircularProgress size={24} /> : '儲存'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* 還原為待開發票對話框 */}
			<Dialog
				open={restoreDialogOpen}
				onClose={() => setRestoreDialogOpen(false)}
				aria-labelledby="restore-dialog-title"
				aria-describedby="restore-dialog-description"
			>
				<DialogTitle id="restore-dialog-title">還原為待開發票</DialogTitle>
				<DialogContent>
					<DialogContentText id="restore-dialog-description">
						您確定要將選中的 {selectedCount} 筆託運單還原為「待開發票」狀態嗎？
						<br />
						此操作將清除所有收款相關資訊（收款日期、方式、備註），託運單將回到可開立發票的狀態。
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRestoreDialogOpen(false)} color="primary">
						取消
					</Button>
					<Button
						onClick={handleConfirmRestore}
						color="primary"
						variant="contained"
						disabled={processingRestore}
					>
						{processingRestore ? <CircularProgress size={24} /> : '確認還原'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
