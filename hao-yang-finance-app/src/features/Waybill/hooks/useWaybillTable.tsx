import { useMemo, useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
	ColumnDef,
	ColumnFiltersState,
	ColumnResizeDirection,
	ColumnResizeMode,
	createColumnHelper,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	GroupingState,
	useReactTable,
} from '@tanstack/react-table';

import { WaybillStatus } from '../types/waybill-status.types';
import { ExtraExpense, Waybill } from '../types/waybill.types';

const columnHelper = createColumnHelper<Waybill>();

export interface UseWaybillTableProps {
	data: Waybill[];
	onDelete: (id: string) => void;
	onSelect: (waybill: Waybill) => void;
	onView: (waybill: Waybill) => void;
}

export function useWaybillTable({ data, onDelete, onSelect, onView }: UseWaybillTableProps) {
	const columns = useMemo<ColumnDef<Waybill, any>[]>(
		() => [
			// columnHelper.accessor('waybillNumber', {
			// 	header: '託運單號',
			// 	enableHiding: true,
			// 	enableGrouping: false,
			// }),
			columnHelper.accessor('date', {
				header: '日期',
				filterFn: (row, columnId, filterValue: [Date, Date]) => {
					if (!filterValue || !filterValue[0] || !filterValue[1]) return true;
					const rowDate = new Date(row.getValue(columnId));
					const [start, end] = filterValue;
					return rowDate >= start && rowDate <= end;
				},
				size: 110,
			}),
			columnHelper.accessor('companyName', {
				header: '貨主',
				size: 220,
			}),
			// columnHelper.accessor('item', {
			// 	header: '貨品',
			// 	enableGrouping: false,
			// }),
			columnHelper.accessor('loadingLocations', {
				header: '地點',
				enableGrouping: false,
				size: 160,
				cell: ({ getValue }) => {
					const locations = (getValue() as Array<{ id?: string; from: string; to: string }>).filter(
						(loc) => loc.from !== '空白' && loc.to !== '空白',
					);

					const MAX_VISIBLE = 2;
					const visible = locations.slice(0, MAX_VISIBLE);
					const remaining = locations.length - visible.length;

					return (
						<Stack direction="row" flexWrap="wrap" gap={0.5}>
							{visible.map((loc, idx) => (
								<Chip
									key={loc.id ?? `${loc.from}-${loc.to}-${idx}`}
									label={`${loc.from} → ${loc.to}`}
									size="small"
									variant="outlined"
								/>
							))}
							{remaining > 0 && (
								<Tooltip
									title={
										<Stack sx={{ maxWidth: 360, p: 0.5 }}>
											{locations.map((loc, idx) => (
												<Typography
													key={`full-${loc.id ?? `${loc.from}-${loc.to}-${idx}`}`}
													variant="body2"
												>
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
					);
				},
			}),
			columnHelper.accessor('driverName', {
				header: '司機',
				size: 100,
			}),
			// columnHelper.accessor('driverId', {
			// 	header: '司機ID',
			// 	enableHiding: true,
			// 	enableGrouping: false,
			// }),
			// columnHelper.accessor('plateNumber', {
			// 	header: '噸數',
			// 	enableGrouping: false,
			// }),
			columnHelper.accessor('fee', {
				header: '運費',
				enableGrouping: false,
				size: 120,
				cell: ({ row }) => {
					const { fee } = row.original;
					const { taxAmount } = row.original;
					if (fee == null) return '';

					if (taxAmount) {
						const totalWithTax = fee + taxAmount;
						return `${fee.toLocaleString()}`;
					}
					return fee.toLocaleString();
				},
			}),
			columnHelper.accessor('status', {
				header: '狀態',
				enableGrouping: false,
				cell: ({ getValue }) => {
					let component: React.ReactNode;
					const status = getValue();
					if (status === WaybillStatus.PENDING) {
						component = <Chip label="待開發票" color="warning" size="small" variant="filled" />;
					} else if (status === WaybillStatus.NO_INVOICE_NEEDED) {
						component = <Chip label="不需開發票" color="default" size="small" variant="filled" />;
					} else if (status === WaybillStatus.INVOICED) {
						component = <Chip label="已開發票" color="success" size="small" variant="filled" />;
					} else if (status === WaybillStatus.NEED_TAX_UNPAID) {
						component = <Chip label="未收款" color="error" size="small" variant="filled" />;
					} else if (status === WaybillStatus.NEED_TAX_PAID) {
						component = <Chip label="已收款" color="success" size="small" variant="filled" />;
					} else {
						component = <Chip label="無狀態" color="info" size="small" variant="filled" />;
					}
					return component;
				},
				size: 140,
			}),
			columnHelper.accessor(
				(row) => row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0),
				{
					id: 'extraExpenses',
					header: '額外費用',
					enableGrouping: false,
					size: 100,
				},
			),
			columnHelper.accessor('notes', {
				header: '備註',
				enableGrouping: false,
				enablePinning: false,
				cell: ({ getValue }) => {
					return <Typography>{getValue()}</Typography>;
				},
			}),
			{
				id: 'actions',
				header: '操作',
				// 不在這裡定義 cell 渲染器，而是在 WaybillGrid 組件中處理
				enableGrouping: false,
				enableSorting: false,
				size: 100,
				enablePinning: true,
				pin: 'right',
				cell: ({ row }) => {
					const waybill = row.original;
					const { status } = waybill;

					return (
						<Stack direction="row" spacing={0.5}>
							{/* PENDING 狀態：編輯、刪除 */}
							{status === WaybillStatus.PENDING && (
								<>
									<Tooltip title="編輯">
										<IconButton size="small" onClick={() => onSelect(waybill)}>
											<EditIcon />
										</IconButton>
									</Tooltip>
									<Tooltip title="刪除">
										<IconButton
											size="small"
											color="error"
											onClick={() => onDelete(waybill.id ?? '')}
										>
											<DeleteIcon />
										</IconButton>
									</Tooltip>
								</>
							)}

							{/* 其他狀態：查看 */}
							{status !== WaybillStatus.PENDING && (
								<Tooltip title="查看詳情">
									<IconButton size="small" onClick={() => onView(waybill)}>
										<VisibilityIcon />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
		],
		[onDelete, onSelect, onView],
	);

	const [grouping, setGrouping] = useState<GroupingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

	const table = useReactTable({
		data,
		columns,
		state: {
			grouping,
			columnFilters,
		},
		autoResetPageIndex: false,
		onColumnFiltersChange: setColumnFilters,
		onGroupingChange: setGrouping,
		columnResizeMode,
		columnResizeDirection,
		enableRowSelection: false,
		enablePinning: true, // 在整個 table 啟用 pinning
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		debugTable: false,
		debugHeaders: false,
		debugColumns: false,
	});

	return { table, columns };
}
