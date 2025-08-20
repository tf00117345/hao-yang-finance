import React from 'react';

import { ArrowDownward, ArrowUpward, UnfoldMore } from '@mui/icons-material';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

import { useWaybillSubTable } from '../../hooks/useWaybillSubTable';
import { Invoice } from '../../types/invoice.type';

interface InvoicedWaybillSubTableProps {
	invoice: Invoice;
}

const InvoicedWaybillSubTable = React.memo(function InvoicedWaybillSubTable({ invoice }: InvoicedWaybillSubTableProps) {
	const subRows = invoice.waybills;

	const { table: subTable, columnFilters, setColumnFilters } = useWaybillSubTable(invoice.waybills, invoice.id);

	// 處理篩選變更
	const handleFilterChange = (columnId: string, value: string) => {
		setColumnFilters((prev) =>
			prev.filter((filter) => filter.id !== columnId).concat(value ? [{ id: columnId, value }] : []),
		);
	};

	// 清除特定欄位的篩選
	const clearFilter = (columnId: string) => {
		setColumnFilters((prev) => prev.filter((filter) => filter.id !== columnId));
	};

	// 取得特定欄位的篩選值
	const getFilterValue = (columnId: string) => {
		return columnFilters.find((filter) => filter.id === columnId)?.value || '';
	};

	// 如果沒有子資料，顯示提示訊息
	if (subRows.length === 0) {
		return (
			<Box sx={{ m: 2 }}>
				<Typography variant="subtitle2" sx={{ mb: 1 }}>
					關聯貨運單：
				</Typography>
				<Typography variant="body2" color="text.secondary">
					沒有關聯的貨運單資料
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ m: 2 }}>
			<Typography variant="subtitle2" sx={{ mb: 1 }}>
				關聯貨運單：
			</Typography>

			<Table size="small" sx={{ tableLayout: 'fixed' }}>
				<TableHead>
					{/* 表頭行 */}
					{subTable.getHeaderGroups().map((headerGroup) => (
						<TableRow key={`${invoice.id}-header-${headerGroup.id}`}>
							{headerGroup.headers.map((header) => (
								<TableCell
									key={`${invoice.id}-header-cell-${header.id}`}
									sx={{
										position: 'relative',
										width: header.getSize(),
										minWidth: 120,
										cursor: header.column.getCanSort() ? 'pointer' : 'default',
										userSelect: 'none',
										'&:hover': header.column.getCanSort()
											? { backgroundColor: 'action.hover' }
											: {},
									}}
									onClick={header.column.getToggleSortingHandler()}
								>
									<Box
										sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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
								</TableCell>
							))}
						</TableRow>
					))}

					{/* 篩選行 */}
					{/* <TableRow>
						{subTable.getHeaderGroups()[0].headers.map((header) => (
							<TableCell key={`${invoice.id}-filter-${header.id}`} sx={{ py: 1, px: 1 }}>
								{header.column.getCanFilter() && (
									<TextField
										size="small"
										placeholder={`篩選 ${header.column.columnDef.header}`}
										value={getFilterValue(header.id)}
										onChange={(e) => handleFilterChange(header.id, e.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FilterList sx={{ fontSize: '1rem', color: 'text.disabled' }} />
												</InputAdornment>
											),
											endAdornment: getFilterValue(header.id) && (
												<InputAdornment position="end">
													<IconButton
														size="small"
														onClick={() => clearFilter(header.id)}
														sx={{ p: 0.5 }}
													>
														<Clear sx={{ fontSize: '0.875rem' }} />
													</IconButton>
												</InputAdornment>
											),
										}}
										sx={{
											width: '100%',
											'& .MuiInputBase-root': {
												fontSize: '0.75rem',
											},
										}}
									/>
								)}
							</TableCell>
						))}
					</TableRow> */}
				</TableHead>

				<TableBody>
					{subTable.getRowModel().rows.map((row) => (
						<TableRow key={`${invoice.id}-row-${row.id}`}>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={`${invoice.id}-cell-${cell.id}`}
									sx={{
										width: cell.column.getSize(),
										maxWidth: cell.column.getSize(),
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Box>
	);
});

export default InvoicedWaybillSubTable;
