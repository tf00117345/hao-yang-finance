import React, { useCallback } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import {
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from '@mui/material';
import { flexRender, Column } from '@tanstack/react-table';

import { StyledTableCell, StyledTableRow } from '../../../Finance/components/styles/styles';
import { useWaybillTable } from '../../hooks/useWaybillTable';
import { Waybill } from '../../types/waybill.types';

interface WaybillGridProps {
	waybills: Waybill[];
	onDelete: (id: string) => void;
	onSelect: (waybill: Waybill) => void;
	onView: (waybill: Waybill) => void;
}

export function WaybillGrid({ waybills, onDelete, onSelect, onView }: WaybillGridProps) {
	const { table } = useWaybillTable({
		data: waybills,
		onDelete,
		onSelect,
		onView,
	});

	const handleGrouping = (e: React.MouseEvent, column: Column<Waybill, any>) => {
		column.toggleGrouping();
		e.stopPropagation();
	};

	const handleSorting = (e: React.MouseEvent, column: Column<Waybill, any>) => {
		column.toggleSorting();
		e.stopPropagation();
	};

	// 渲染單元格內容的函數
	const renderCellContent = useCallback((cell: any, row: any) => {
		if (cell.getIsGrouped()) {
			return (
				<Stack direction="row" alignItems="center" spacing={1}>
					<IconButton
						size="small"
						onClick={row.getToggleExpandedHandler()}
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
		<Stack sx={{ flexGrow: 1, overflow: 'auto' }} spacing={1}>
			<TableContainer component={Paper} sx={{ border: '1px solid #E0E0E0' }}>
				<Table stickyHeader>
					<TableHead>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<StyledTableCell
										size="small"
										key={header.id}
										colSpan={header.colSpan}
										onClick={(e) => header.column.getCanSort() && handleSorting(e, header.column)}
										sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
									>
										{header.isPlaceholder ? null : (
											<Stack direction="row" alignItems="center" spacing={1}>
												{header.column.getCanGroup() && (
													<IconButton
														size="small"
														sx={{ color: 'inherit' }}
														onClick={(e) => handleGrouping(e, header.column)}
													>
														{header.column.getIsGrouped() ? (
															<CancelIcon fontSize="small" sx={{ color: 'red' }} />
														) : (
															<GroupIcon fontSize="small" sx={{ color: '#2196F3' }} />
														)}
													</IconButton>
												)}
												{flexRender(header.column.columnDef.header, header.getContext())}
												{(header.column.getCanSort() &&
													{
														asc: ' 🔼',
														desc: ' 🔽',
													}[header.column.getIsSorted() as string]) ??
													null}
											</Stack>
										)}
									</StyledTableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<StyledTableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell size="small" key={cell.id}>
										{renderCellContent(cell, row)}
									</TableCell>
								))}
							</StyledTableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
}
