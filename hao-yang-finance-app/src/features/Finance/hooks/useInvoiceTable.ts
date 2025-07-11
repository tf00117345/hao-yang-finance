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
	ExpandedState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Invoice } from '../types/invoice.type';

const invoiceColumnHelper = createColumnHelper<Invoice>();

export function useInvoiceTable(data: Invoice[], onVoidInvoice: (invoiceId: string) => void) {
	const columns = useMemo(
		() => [
			{
				id: 'expander',
				header: '發票號碼',
				cell: ({ row }) => row.original.id,
				enableSorting: false,
				enableGrouping: false,
			},
			invoiceColumnHelper.accessor('customerName', {
				header: '客戶名稱',
				cell: (info) => info.getValue(),
			}),
			invoiceColumnHelper.accessor('date', {
				header: '日期',
				cell: (info) => info.getValue(),
			}),
			invoiceColumnHelper.accessor('amount', {
				header: '金額',
				cell: (info) => info.getValue().toLocaleString(),
				enableGrouping: false,
			}),
			invoiceColumnHelper.accessor('status', {
				header: '狀態',
				cell: (info) => info.getValue(),
			}),
			{
				id: 'actions',
				header: '操作',
				cell: ({ row }) => row.original.id,
				enableSorting: false,
				enableGrouping: false,
			},
		],
		[onVoidInvoice],
	);

	const [grouping, setGrouping] = useState<GroupingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

	// 確保資料穩定性
	const stableData = useMemo(() => data.filter(Boolean), [data]);

	const table = useReactTable({
		data: stableData,
		columns,
		state: {
			grouping,
			columnFilters,
			expanded,
		},
		onColumnFiltersChange: setColumnFilters,
		onGroupingChange: setGrouping,
		onExpandedChange: setExpanded,
		columnResizeMode,
		columnResizeDirection,
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getRowCanExpand: (row) => !!(row.original.waybillIds && row.original.waybillIds.length > 0),
		getRowId: (row) => row.id, // 確保每個 row 有唯一的 ID
		debugTable: false, // 關閉 debug 來提高性能
		debugHeaders: false,
		debugColumns: false,
	});

	return { table, columns };
}
