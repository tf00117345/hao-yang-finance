import { useMemo, useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Chip, IconButton } from '@mui/material';
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

import { Waybill, ExtraExpense } from '../types/waybill.types';

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
			}),
			columnHelper.accessor('companyName', {
				header: '貨主',
			}),
			columnHelper.accessor('item', {
				header: '貨品',
				enableGrouping: false,
			}),
			columnHelper.accessor('driverName', {
				header: '司機',
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
			}),
			columnHelper.accessor('status', {
				header: '狀態',
				enableGrouping: false,
				cell: ({ getValue }) => {
					let component: React.ReactNode;
					if (getValue() === 'PENDING') {
						component = <Chip label="未開立" color="error" size="small" variant="filled" />;
					} else if (getValue() === 'NO_INVOICE_NEEDED') {
						component = <Chip label="無須開發票" color="warning" size="small" variant="filled" />;
					} else if (getValue() === 'INVOICED') {
						component = <Chip label="已開立" color="success" size="small" variant="filled" />;
					} else {
						component = <Chip label="無狀態" color="info" size="small" variant="filled" />;
					}
					return component;
				},
			}),
			columnHelper.accessor(
				(row) => row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0),
				{
					id: 'extraExpenses',
					header: '額外費用',
					enableGrouping: false,
				},
			),
			{
				id: 'actions',
				header: '操作',
				// 不在這裡定義 cell 渲染器，而是在 WaybillGrid 組件中處理
				enableGrouping: false,
				enableSorting: false,
				cell: ({ row }) => {
					if (row.original.status === 'PENDING') {
						return (
							<>
								<IconButton size="small" onClick={() => onSelect(row.original)}>
									<EditIcon />
								</IconButton>
								<IconButton size="small" color="error" onClick={() => onDelete(row.original.id ?? '')}>
									<DeleteIcon />
								</IconButton>
							</>
						);
					}
					return (
						<IconButton size="small" onClick={() => onView(row.original)}>
							<VisibilityIcon />
						</IconButton>
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
