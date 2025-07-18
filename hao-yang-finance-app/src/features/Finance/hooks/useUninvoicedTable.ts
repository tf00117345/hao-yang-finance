import {
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
	RowSelectionState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Waybill, ExtraExpense } from '../../Waybill/types/waybill.types';

const columnHelper = createColumnHelper<Waybill>();

export function useUninvoicedTable(data: Waybill[]) {
	const columns = useMemo(
		() => [
			{
				id: 'select',
				header: '選擇',
				cell: 'checkbox',
				enableSorting: false,
				enableGrouping: false,
			},
			columnHelper.accessor('companyName', {
				header: '客戶名稱',
				cell: (info) => info.getValue(),
			}),
			{
				accessorKey: 'date',
				header: '日期',
				filterFn: (row, columnId, filterValue: [Date, Date]) => {
					if (!filterValue || !filterValue[0] || !filterValue[1]) return true;

					const rowDate = new Date(row.getValue(columnId));
					const [start, end] = filterValue;

					return rowDate >= start && rowDate <= end;
				},
			},
			columnHelper.accessor('item', {
				header: '貨物',
				cell: (info) => info.getValue(),
				enableGrouping: false,
			}),
			columnHelper.accessor('fee', {
				header: '金額',
				cell: (info) => info.getValue(),
				enableGrouping: false,
			}),
			columnHelper.accessor(
				(row) => row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0),
				{
					header: '額外費用',
					cell: (info) => info.getValue(),
					enableGrouping: false,
				},
			),
			columnHelper.accessor(
				(row) =>
					(row.fee +
						row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0)) *
					0.2,
				{
					header: '稅金',
					cell: (info) => info.getValue(),
					enableGrouping: false,
				},
			),
			columnHelper.accessor(
				(row) =>
					(row.fee +
						row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0)) *
						0.2 +
					row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0) +
					row.fee,
				{
					header: '發票金額',
					cell: (info) => info.getValue(),
					enableGrouping: false,
				},
			),
			columnHelper.accessor('driverName', {
				header: '司機',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('plateNumber', {
				header: '噸數',
				cell: (info) => info.getValue(),
				enableGrouping: false,
			}),
		],
		[],
	);

	const [grouping, setGrouping] = useState<GroupingState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

	const table = useReactTable({
		data,
		columns,
		state: {
			grouping,
			columnFilters,
			rowSelection,
		},
		onColumnFiltersChange: setColumnFilters,
		onGroupingChange: setGrouping,
		onRowSelectionChange: setRowSelection,
		enableRowSelection: true,
		columnResizeMode,
		columnResizeDirection,
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		debugTable: true,
		debugHeaders: true,
		debugColumns: false,
	});

	return { table, columns, rowSelection };
}
