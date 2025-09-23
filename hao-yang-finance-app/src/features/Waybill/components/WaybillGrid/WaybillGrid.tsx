import React, { useCallback } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import {
	Box,
	Card,
	CardActions,
	CardContent,
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
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { Column, flexRender } from '@tanstack/react-table';

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
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

	// 手機版 Card 渲染
	const renderMobileCard = (waybill: Waybill) => {
		const getStatusDisplay = (status: string) => {
			switch (status) {
				case 'PENDING':
					return { color: 'warning' as const, text: '待開發票' };
				case 'INVOICED':
					return { color: 'success' as const, text: '已開發票' };
				case 'NO_INVOICE_NEEDED':
					return { color: 'default' as const, text: '不需開發票' };
				case 'PENDING_PAYMENT':
					return { color: 'error' as const, text: '待收款' };
				default:
					return { color: 'default' as const, text: '無狀態' };
			}
		};

		const { color: statusColor, text: statusText } = getStatusDisplay(waybill.status);

		return (
			<Card
				key={waybill.id}
				sx={{
					mb: 1,
					cursor: 'pointer',
					'&:hover': { backgroundColor: 'action.hover' },
				}}
				onClick={() => onSelect(waybill)}
			>
				<CardContent sx={{ pb: 1 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
						<Box sx={{ flex: 1 }}>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								{waybill.date} • {waybill.driverName} • {waybill.tonnage}噸
							</Typography>
							<Typography variant="h6" component="div" sx={{ mb: 1 }}>
								{waybill.companyName}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{waybill.item} •
								{waybill.loadingLocations
									.map((location) => `${location.from} → ${location.to}`)
									.join(', ')}
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'right' }}>
							<Chip label={statusText} color={statusColor} size="small" sx={{ mb: 1 }} />
							<Typography variant="h6" color="primary">
								${waybill.fee?.toLocaleString()}
							</Typography>
						</Box>
					</Stack>
				</CardContent>
				{waybill.status === 'PENDING' && (
					<CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(waybill.id);
							}}
							color="error"
						>
							<CancelIcon />
						</IconButton>
					</CardActions>
				)}
			</Card>
		);
	};

	return (
		<Stack sx={{ flexGrow: 1, overflow: 'auto' }} spacing={1}>
			{isMobile ? (
				// 手機版：Card 佈局
				<Box sx={{ px: 1 }}>
					{waybills.length === 0 ? (
						<Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
							暫無資料
						</Typography>
					) : (
						waybills.map(renderMobileCard)
					)}
				</Box>
			) : (
				// 桌面版：Table 佈局
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
											onClick={(e) =>
												header.column.getCanSort() && handleSorting(e, header.column)
											}
											sx={{
												cursor: header.column.getCanSort() ? 'pointer' : 'default',
												minWidth:
													header.column.getSize() + (header.column.getIsGrouped() ? 60 : 0),
												position: header.column.getCanPin() ? 'sticky' : 'static',
												right: header.column.getCanPin() ? 0 : undefined,
											}}
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
										<TableCell
											size="small"
											key={cell.id}
											sx={{
												position: cell.column.getCanPin() ? 'sticky' : 'static',
												right: cell.column.getCanPin() ? 0 : undefined,
												backgroundColor: cell.column.getCanPin() ? 'white' : undefined,
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
			)}
		</Stack>
	);
}
