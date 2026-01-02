import { useCallback, useMemo, useState } from 'react';

import {
	ArrowDownward,
	ArrowUpward,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Payment as PaymentIcon,
	UnfoldMore,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
	Box,
	Chip,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import { format } from 'date-fns';

import { useCollectionRequests, useDeleteCollectionRequest } from '../../../../hooks/useCollectionRequest';
import { useCollectionRequestTable } from '../../hooks/useCollectionRequestTable';
import { useStickyFilterTop } from '../../hooks/useStickyFilterTop';
import {
	CollectionRequest,
	CollectionRequestRules,
	CollectionRequestStatus,
	CollectionRequestStatusColors,
	CollectionRequestStatusLabels,
} from '../../types/collection-request.types';
import { CollectionRequestDetailDialog } from '../CollectionRequestDetailDialog/CollectionRequestDetailDialog';
import { CreateCollectionRequestDialog } from '../CreateCollectionRequestDialog/CreateCollectionRequestDialog';
import { MarkCollectionPaidDialog } from '../MarkCollectionPaidDialog/MarkCollectionPaidDialog';
import { SmartFilterInput } from '../shared/SmartFilterInput';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

interface CollectionRequestTableProps {
	companyId?: string;
	status?: CollectionRequestStatus;
	startDate?: string;
	endDate?: string;
}

// 格式化貨幣
const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('zh-TW', {
		style: 'currency',
		currency: 'TWD',
		minimumFractionDigits: 0,
	}).format(amount);
};

export function CollectionRequestTable({ companyId, status, startDate, endDate }: CollectionRequestTableProps) {
	const [selectedRequest, setSelectedRequest] = useState<CollectionRequest | null>(null);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);

	const { data: collectionRequests = [], isLoading } = useCollectionRequests({
		companyId,
		status,
		startDate,
		endDate,
	});

	const deleteMutation = useDeleteCollectionRequest();

	const { table, columnFilters, setColumnFilters } = useCollectionRequestTable(collectionRequests);
	const { tableHeadRef, filterRowRef, filterTop } = useStickyFilterTop();

	const handleViewDetail = useCallback((request: CollectionRequest) => {
		setSelectedRequest(request);
		setDetailDialogOpen(true);
	}, []);

	const handleEdit = useCallback((request: CollectionRequest) => {
		setSelectedRequest(request);
		setEditDialogOpen(true);
	}, []);

	const handleMarkPaid = useCallback((request: CollectionRequest) => {
		setSelectedRequest(request);
		setMarkPaidDialogOpen(true);
	}, []);

	const handleDelete = useCallback(
		async (request: CollectionRequest) => {
			if (window.confirm(`確定要刪除請款單 ${request.requestNumber} 嗎？`)) {
				try {
					await deleteMutation.mutateAsync(request.id);
				} catch (error) {
					console.error('刪除請款單失敗:', error);
				}
			}
		},
		[deleteMutation],
	);

	// 處理篩選變更
	const handleFilterChange = useCallback(
		(columnId: string, value: string) => {
			setColumnFilters((prev) =>
				prev.filter((filter) => filter.id !== columnId).concat(value ? [{ id: columnId, value }] : []),
			);
		},
		[setColumnFilters],
	);

	// 清除特定欄位的篩選
	const clearFilter = useCallback(
		(columnId: string) => {
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

	// 處理排序
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
				});
				return acc;
			},
			{} as Record<string, (e: React.MouseEvent) => void>,
		);
	}, [table, handleSorting]);

	// 渲染單元格內容的函數
	const renderCellContent = useCallback(
		(cell: any, row: any) => {
			const request = row.original as CollectionRequest;

			// 處理操作欄位
			if (cell.column.id === 'actions') {
				return (
					<Stack direction="row" spacing={0.5} justifyContent="center">
						<Tooltip title="查看詳情">
							<IconButton size="small" onClick={() => handleViewDetail(request)}>
								<VisibilityIcon fontSize="small" />
							</IconButton>
						</Tooltip>

						{CollectionRequestRules.canEdit(request.status) && (
							<Tooltip title="編輯請款單">
								<IconButton size="small" color="primary" onClick={() => handleEdit(request)}>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}

						{CollectionRequestRules.canMarkPaid(request.status) && (
							<Tooltip title="標記已收款">
								<IconButton size="small" color="success" onClick={() => handleMarkPaid(request)}>
									<PaymentIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}

						{CollectionRequestRules.canDelete(request.status) && (
							<Tooltip title="刪除請款單">
								<IconButton size="small" color="error" onClick={() => handleDelete(request)}>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
					</Stack>
				);
			}

			// 處理狀態欄位
			if (cell.column.id === 'status') {
				const cellStatus = cell.getValue() as CollectionRequestStatus;
				return (
					<Chip
						label={CollectionRequestStatusLabels[cellStatus]}
						color={CollectionRequestStatusColors[cellStatus]}
						size="small"
					/>
				);
			}

			// 處理託運單數欄位
			if (cell.column.id === 'waybillCount') {
				return <Chip label={`${cell.getValue()} 筆`} size="small" />;
			}

			// 處理日期欄位
			if (cell.column.id === 'requestDate') {
				return format(new Date(cell.getValue()), 'yyyy/MM/dd');
			}

			// 處理金額欄位
			if (['subtotal', 'taxAmount', 'totalAmount'].includes(cell.column.id)) {
				const value = cell.getValue() as number;
				if (cell.column.id === 'totalAmount') {
					return <Typography fontWeight="bold">{formatCurrency(value)}</Typography>;
				}
				return formatCurrency(value);
			}

			return flexRender(cell.column.columnDef.cell, cell.getContext());
		},
		[handleViewDetail, handleEdit, handleMarkPaid, handleDelete],
	);

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
				<Typography>載入中...</Typography>
			</Box>
		);
	}

	if (collectionRequests.length === 0) {
		return (
			<Box sx={{ p: 3, textAlign: 'center' }}>
				<Typography color="text.secondary">目前沒有請款單資料</Typography>
			</Box>
		);
	}

	return (
		<>
			<TableContainer
				component={Paper}
				sx={{
					flex: 1,
					overflow: 'auto',
					border: '1px solid #E0E0E0',
					display: 'flex',
					flexDirection: 'column',
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
											minWidth: header.column.columnDef.minSize || 80,
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
											entityType={header.id === 'status' ? 'collectionRequest' : undefined}
										/>
									)}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<StyledTableRow key={row.id} hover>
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

			{/* Detail Dialog */}
			{selectedRequest && (
				<CollectionRequestDetailDialog
					open={detailDialogOpen}
					collectionRequestId={selectedRequest.id}
					onClose={() => {
						setDetailDialogOpen(false);
						setSelectedRequest(null);
					}}
				/>
			)}

			{/* Edit Dialog */}
			{selectedRequest && (
				<CreateCollectionRequestDialog
					open={editDialogOpen}
					collectionRequest={selectedRequest}
					onClose={() => {
						setEditDialogOpen(false);
						setSelectedRequest(null);
					}}
				/>
			)}

			{/* Mark Paid Dialog */}
			{selectedRequest && (
				<MarkCollectionPaidDialog
					open={markPaidDialogOpen}
					collectionRequest={selectedRequest}
					onClose={() => {
						setMarkPaidDialogOpen(false);
						setSelectedRequest(null);
					}}
				/>
			)}
		</>
	);
}
