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
import { Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useMemo, useState } from 'react';
import { Waybill, ExtraExpense } from '../types/waybill.types';

const columnHelper = createColumnHelper<Waybill>();

export interface UseWaybillTableProps {
	data: Waybill[];
	onDelete: (id: string) => void;
	onSelect: (waybill: Waybill) => void;
}

export function useWaybillTable({ data, onDelete, onSelect }: UseWaybillTableProps) {
	const columns = useMemo<ColumnDef<Waybill, any>[]>(
		() => [
			columnHelper.accessor('waybillNumber', {
				header: '託運單號',
				enableHiding: true,
				enableGrouping: false,
			}),
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
			columnHelper.accessor('isInvoiceIssued', {
				header: '已開立發票',
				enableGrouping: false,
				cell: ({ getValue }) =>
					getValue() ? (
						<Chip label="已開立" color="success" size="small" variant="filled" />
					) : (
						<Chip label="未開立" color="error" size="small" variant="filled" />
					),
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
				cell: ({ row }) => (
					<>
						<IconButton size="small" onClick={() => onSelect(row.original)}>
							<EditIcon />
						</IconButton>
						<IconButton size="small" color="error" onClick={() => onDelete(row.original.id ?? '')}>
							<DeleteIcon />
						</IconButton>
					</>
				),
			},
		],
		[],
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
		debugTable: true,
		debugHeaders: true,
		debugColumns: false,
	});

	return { table, columns };
}
