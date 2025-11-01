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
	useMarkWaybillAsNoInvoiceNeededMutation,
	useRestoreWaybillMutation,
	useUpdateWaybillNotesMutation,
} from '../../../Waybill/api/mutation';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { usePendingPaymentTable } from '../../hooks/usePendingPaymentTable';
import { useStickyFilterTop } from '../../hooks/useStickyFilterTop';
import { SmartFilterInput } from '../shared/SmartFilterInput';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface PendingPaymentTableProps {
	waybills: Waybill[];
}

export function PendingPaymentTable({ waybills }: PendingPaymentTableProps) {
	const isMountedRef = useRef(false);
	const [confirmCompleteDialogOpen, setConfirmCompleteDialogOpen] = useState(false);
	const [completeNotesDialogOpen, setCompleteNotesDialogOpen] = useState(false);
	const [editNotesDialogOpen, setEditNotesDialogOpen] = useState(false);
	const [editingWaybill, setEditingWaybill] = useState<Waybill | null>(null);
	const [completingWaybill, setCompletingWaybill] = useState<Waybill | null>(null);
	const [notes, setNotes] = useState('');
	const [completeNotes, setCompleteNotes] = useState('');
	const [processingComplete, setProcessingComplete] = useState(false);
	const [processingNotes, setProcessingNotes] = useState(false);
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
	const [restoreWaybill, setRestoreWaybill] = useState<Waybill | null>(null);
	const [processingRestore, setProcessingRestore] = useState(false);
	const { tableHeadRef, filterRowRef, filterTop } = useStickyFilterTop();

	const { table, columnFilters, setColumnFilters } = usePendingPaymentTable(waybills);
	const markAsNoInvoiceNeededMutation = useMarkWaybillAsNoInvoiceNeededMutation();
	const updateNotesMutation = useUpdateWaybillNotesMutation();
	const restoreWaybillMutation = useRestoreWaybillMutation();

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

	// 處理確認收款完成（先打開備註編輯對話框）
	const handleOpenCompleteDialog = () => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			// eslint-disable-next-line no-alert
			alert('請先選擇一筆資料');
			return;
		}
		if (selected.length > 1) {
			// eslint-disable-next-line no-alert
			alert('確認收款完成僅支援單筆操作，請只選擇一筆資料');
			return;
		}

		setCompletingWaybill(selected[0]);
		setCompleteNotes(selected[0].notes || '');
		setCompleteNotesDialogOpen(true);
	};

	// 從備註編輯對話框進入確認對話框
	const handleProceedToConfirm = () => {
		setCompleteNotesDialogOpen(false);
		setConfirmCompleteDialogOpen(true);
	};

	// 取消確認收款完成流程
	const handleCancelComplete = () => {
		setCompleteNotesDialogOpen(false);
		setConfirmCompleteDialogOpen(false);
		setCompletingWaybill(null);
		setCompleteNotes('');
	};

	// 處理編輯備註
	const handleEditNotes = (waybill: Waybill) => {
		setEditingWaybill(waybill);
		setNotes(waybill.notes || '');
		setEditNotesDialogOpen(true);
	};

	// 處理還原為未開發票
	const handleOpenRestoreDialog = () => {
		const selected = table.getSelectedRowModel().rows.map((row) => row.original);
		if (selected.length === 0) {
			// eslint-disable-next-line no-alert
			alert('請先選擇一筆資料');
			return;
		}
		if (selected.length > 1) {
			// eslint-disable-next-line no-alert
			alert('還原為未開發票僅支援單筆操作，請只選擇一筆資料');
			return;
		}

		setRestoreWaybill(selected[0]);
		setRestoreDialogOpen(true);
	};

	// 確認收款完成，歸檔到無須開發票
	const handleConfirmComplete = async () => {
		if (!completingWaybill) return;

		setProcessingComplete(true);

		try {
			// 先更新備註（如果有修改）
			if (completeNotes.trim() !== (completingWaybill.notes || '')) {
				await updateNotesMutation.mutateAsync({
					waybillId: completingWaybill.id,
					notes: completeNotes.trim(),
				});
			}

			// 然後標記為無須開發票
			await markAsNoInvoiceNeededMutation.mutateAsync(completingWaybill.id);

			// 處理完成後清理狀態
			setConfirmCompleteDialogOpen(false);
			setCompletingWaybill(null);
			setCompleteNotes('');
			table.resetRowSelection();
		} catch (error) {
			// 錯誤處理已由 mutation 的 onError 處理
			console.error('標記為無須開發票失敗:', error);
		} finally {
			setProcessingComplete(false);
		}
	};

	// 更新備註
	const handleUpdateNotes = async () => {
		if (!editingWaybill) return;

		setProcessingNotes(true);

		try {
			await updateNotesMutation.mutateAsync({
				waybillId: editingWaybill.id,
				notes: notes.trim(),
			});

			// 處理完成後清理狀態
			setEditNotesDialogOpen(false);
			setEditingWaybill(null);
			setNotes('');
		} catch (error) {
			// 錯誤處理已由 mutation 的 onError 處理
			console.error('更新備註失敗:', error);
		} finally {
			setProcessingNotes(false);
		}
	};

	// 確認還原為未開發票
	const handleConfirmRestore = async () => {
		if (!restoreWaybill) return;

		setProcessingRestore(true);

		try {
			await restoreWaybillMutation.mutateAsync(restoreWaybill.id);

			// 處理完成後清理狀態
			setRestoreDialogOpen(false);
			setRestoreWaybill(null);
			table.resetRowSelection();
		} catch (error) {
			// 錯誤處理已由 mutation 的 onError 處理
			console.error('還原為未開發票失敗:', error);
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
			return (
				<Stack direction="row" spacing={0.5}>
					<IconButton
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							handleEditNotes(row.original);
						}}
						title="編輯備註"
					>
						<EditIcon fontSize="small" />
					</IconButton>
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

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
				<Stack direction="row" spacing={1}>
					<Typography sx={{ flex: '1 1 100%', px: 2 }} variant="h6" component="div">
						待收款之貨運單
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
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						還原未開發票
					</Button>
					<Button
						sx={{ width: '150px' }}
						size="small"
						variant="contained"
						color="success"
						startIcon={<CheckCircleIcon />}
						onClick={() => handleOpenCompleteDialog()}
						disabled={table.getSelectedRowModel().rows.length === 0}
					>
						確認收款完成
					</Button>
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
							{table.getHeaderGroups()[0].headers.map((header) => (
								<TableCell
									key={`filter-${header.id}`}
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

			{/* 確認收款完成備註編輯對話框 */}
			<Dialog
				open={completeNotesDialogOpen}
				onClose={handleCancelComplete}
				aria-labelledby="complete-notes-dialog-title"
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle id="complete-notes-dialog-title">確認收款完成 - {completingWaybill?.id}</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 1 }}>
						將此託運單標記為「收款完成」並歸檔到「無須開發票」狀態。
						<br />
						請輸入收款完成的相關備註：
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						label="收款完成備註"
						fullWidth
						multiline
						rows={4}
						variant="outlined"
						value={completeNotes}
						onChange={(e) => setCompleteNotes(e.target.value)}
						placeholder="請輸入收款完成的相關備註（例如：收款日期、收款方式等）..."
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelComplete} color="primary">
						取消
					</Button>
					<Button onClick={handleProceedToConfirm} color="success" variant="contained">
						繼續確認
					</Button>
				</DialogActions>
			</Dialog>

			{/* 最終確認收款完成對話框 */}
			<Dialog
				open={confirmCompleteDialogOpen}
				onClose={handleCancelComplete}
				aria-labelledby="confirm-complete-dialog-title"
				aria-describedby="confirm-complete-dialog-description"
			>
				<DialogTitle id="confirm-complete-dialog-title">最終確認收款完成</DialogTitle>
				<DialogContent>
					<DialogContentText id="confirm-complete-dialog-description">
						您確定要將託運單「{completingWaybill?.id}」標記為「收款完成」並歸檔到「無須開發票」狀態嗎？
						<br />
						<br />
						備註內容：{completeNotes || '(無備註)'}
						<br />
						<br />
						此操作表示款項已收齊，託運單已完成處理。
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setConfirmCompleteDialogOpen(false);
							setCompleteNotesDialogOpen(true);
						}}
						color="primary"
					>
						返回編輯
					</Button>
					<Button
						onClick={handleConfirmComplete}
						color="success"
						variant="contained"
						disabled={processingComplete}
					>
						{processingComplete ? <CircularProgress size={24} /> : '確認完成'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* 編輯備註對話框 */}
			<Dialog
				open={editNotesDialogOpen}
				onClose={() => setEditNotesDialogOpen(false)}
				aria-labelledby="edit-notes-dialog-title"
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle id="edit-notes-dialog-title">編輯備註</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="備註"
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

			{/* 還原為未開發票對話框 */}
			<Dialog
				open={restoreDialogOpen}
				onClose={() => setRestoreDialogOpen(false)}
				aria-labelledby="restore-dialog-title"
				aria-describedby="restore-dialog-description"
			>
				<DialogTitle id="restore-dialog-title">還原為未開發票</DialogTitle>
				<DialogContent>
					<DialogContentText id="restore-dialog-description">
						您確定要將託運單「{restoreWaybill?.id}」還原為「未開立發票」狀態嗎？
						<br />
						此操作將移除待收款標記，託運單將回到可開立發票的狀態。
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
