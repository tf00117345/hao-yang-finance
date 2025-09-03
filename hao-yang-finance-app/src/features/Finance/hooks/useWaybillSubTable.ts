import { useMemo, useState } from 'react';

import {
	ColumnFiltersState,
	ColumnResizeDirection,
	ColumnResizeMode,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';

import { InvoiceWaybill } from '../types/invoice.type';

const columnHelper = createColumnHelper<InvoiceWaybill>();

export function useWaybillSubTable(data: InvoiceWaybill[], invoiceId: string) {
	const columns = useMemo(
		() => [
			// columnHelper.accessor('waybillId', {
			// 	header: '貨運單ID',
			// 	cell: (info) => info.getValue(),
			// }),
			// columnHelper.accessor('waybillNumber', {
			// 	header: '貨運單編號',
			// 	cell: (info) => info.getValue(),
			// 	enableSorting: true,
			// 	enableColumnFilter: true,
			// 	filterFn: 'includesString',
			// }),
			columnHelper.accessor('date', {
				header: '日期',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableColumnFilter: true,
				sortingFn: 'datetime',
			}),
			columnHelper.accessor('waybillCompanyName', {
				header: '客戶',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableColumnFilter: true,
				filterFn: 'includesString',
			}),
			columnHelper.accessor('fee', {
				header: '金額',
				cell: (info) => info.getValue()?.toLocaleString() || '0',
				enableSorting: true,
				enableColumnFilter: true,
				sortingFn: 'basic',
				filterFn: 'inNumberRange',
			}),
			// columnHelper.accessor('extraExpensesIncludeTax', {
			// 	header: '額外費用是否含稅',
			// 	enableSorting: true,
			// 	enableColumnFilter: true,
			// 	cell: (info) => (info.getValue() ? '是' : '否'),
			// 	filterFn: 'equals',
			// }),
			columnHelper.accessor('extraExpenses', {
				header: '額外費用',
				cell: (info) => {
					const total =
						info
							.getValue()
							?.map((item) => item.fee)
							?.reduce((acc, curr) => acc + curr, 0) || 0;
					return total.toLocaleString();
				},
				enableSorting: true,
				enableColumnFilter: true,
				sortingFn: (rowA, rowB, columnId) => {
					const aValue = rowA.original.extraExpenses?.reduce((acc, curr) => acc + curr.fee, 0) || 0;
					const bValue = rowB.original.extraExpenses?.reduce((acc, curr) => acc + curr.fee, 0) || 0;
					return aValue - bValue;
				},
				filterFn: (row, columnId, filterValue) => {
					const total = row.original.extraExpenses?.reduce((acc, curr) => acc + curr.fee, 0) || 0;
					return total >= (filterValue[0] || 0) && total <= (filterValue[1] || Infinity);
				},
			}),
			columnHelper.accessor('driverName', {
				header: '司機',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableColumnFilter: true,
				filterFn: 'includesString',
			}),
		],
		[],
	);

	// 確保資料穩定性
	const stableData = useMemo(() => data.filter(Boolean), [data]);

	// Table state management
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

	const table = useReactTable({
		data: stableData,
		columns,
		state: {
			columnFilters,
			sorting,
		},
		autoResetPageIndex: false,
		// State change handlers
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		// Features configuration
		enableRowSelection: false,
		enableSorting: true,
		enableColumnResizing: true,
		enableColumnFilters: true,
		// Resize configuration
		columnResizeMode,
		columnResizeDirection,
		// Row models
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => `${invoiceId}-${row.waybillId}`, // 使用 invoiceId 前綴來避免 ID 衝突
	});

	return {
		table,
		columns,
		// Table states for external access
		columnFilters,
		setColumnFilters,
		sorting,
		setSorting,
	};
}
