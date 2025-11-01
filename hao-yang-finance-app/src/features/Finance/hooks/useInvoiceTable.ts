import { useCallback, useMemo, useState } from 'react';

import {
	ColumnFiltersState,
	ColumnPinningState,
	ColumnResizeDirection,
	ColumnResizeMode,
	createColumnHelper,
	ExpandedState,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	GroupingState,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';

import { Invoice } from '../types/invoice.type';

const invoiceColumnHelper = createColumnHelper<Invoice>();

interface UseInvoiceTableProps {
	data: Invoice[];
	onVoidInvoice?: (invoiceId: string) => void;
	onEditInvoice?: (invoice: Invoice) => void;
	onMarkPaid?: (invoiceId: string) => void;
	onDeleteInvoice?: (invoiceId: string) => void;
}

export function useInvoiceTable({
	data,
	onVoidInvoice,
	onEditInvoice,
	onMarkPaid,
	onDeleteInvoice,
}: UseInvoiceTableProps) {
	const columns = useMemo(
		() => [
			invoiceColumnHelper.accessor('invoiceNumber', {
				id: 'expander',
				header: '發票號碼',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: false,
				enableResizing: true,
				size: 140,
				minSize: 120,
			}),
			invoiceColumnHelper.accessor('companyName', {
				header: '客戶名稱',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: true,
				enableResizing: true,
				enableColumnFilter: true,
				filterFn: 'includesString',
				size: 180,
				minSize: 140,
			}),
			// invoiceColumnHelper.accessor('date', {
			// 	header: '開立日期',
			// 	cell: (info) => {
			// 		const date = new Date(info.getValue());
			// 		return date.toLocaleDateString('zh-TW');
			// 	},
			// 	enableSorting: true,
			// 	enableGrouping: false,
			// 	enableResizing: true,
			// 	enableColumnFilter: true,
			// 	size: 140,
			// 	minSize: 140,
			// }),
			// invoiceColumnHelper.accessor('subtotal', {
			// 	header: '小計',
			// 	cell: (info) => `$${info.getValue().toLocaleString()}`,
			// 	enableSorting: true,
			// 	enableGrouping: false,
			// 	enableResizing: true,
			// 	enableColumnFilter: true,
			// 	filterFn: 'inNumberRange',
			// 	size: 100,
			// 	minSize: 80,
			// 	maxSize: 120,
			// }),
			// invoiceColumnHelper.accessor('tax', {
			// 	header: '稅額',
			// 	cell: (info) => `$${info.getValue().toLocaleString()}`,
			// 	enableSorting: true,
			// 	enableGrouping: false,
			// 	enableResizing: true,
			// 	enableColumnFilter: true,
			// 	filterFn: 'inNumberRange',
			// 	size: 100,
			// 	minSize: 80,
			// 	maxSize: 120,
			// }),
			invoiceColumnHelper.accessor('extraExpenses', {
				header: '額外費用總額',
				cell: (info) =>
					`$${info
						.getValue()
						?.reduce((sum, expense) => sum + expense.fee, 0)
						.toLocaleString()}`,
				enableSorting: true,
				enableGrouping: false,
				enableResizing: true,
				enableColumnFilter: true,
				filterFn: 'inNumberRange',
				size: 140,
				minSize: 140,
			}),
			invoiceColumnHelper.accessor('waybills', {
				header: '發票金額',
				cell: (info) => {
					const waybillAmount = info.getValue()?.reduce((sum, waybill) => sum + (waybill.fee || 0), 0);
					const total = waybillAmount + info.row.original.tax;
					return `$${total.toLocaleString()}`;
				},
				enableSorting: true,
				enableGrouping: false,
				enableResizing: true,
				enableColumnFilter: true,
				filterFn: 'inNumberRange',
				size: 140,
				minSize: 140,
			}),
			invoiceColumnHelper.accessor('total', {
				header: '應收帳款',
				cell: (info) => `$${info.getValue().toLocaleString()}`,
				enableSorting: true,
				enableGrouping: false,
				enableResizing: true,
				enableColumnFilter: true,
				filterFn: 'inNumberRange',
				size: 140,
				minSize: 140,
			}),
			invoiceColumnHelper.accessor('status', {
				header: '狀態',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: true,
				enableResizing: true,
				enableColumnFilter: true,
				filterFn: 'equals',
				size: 100,
			}),
			// invoiceColumnHelper.accessor('paymentMethod', {
			// 	header: '付款方式',
			// 	cell: (info) => info.getValue(),
			// 	enableSorting: true,
			// 	enableGrouping: true,
			// 	enableResizing: true,
			// 	enableColumnFilter: true,
			// 	filterFn: 'equals',
			// 	size: 120,
			// 	minSize: 120,
			// }),
			// invoiceColumnHelper.accessor('paymentNote', {
			// 	header: '付款備註',
			// 	cell: (info) => info.getValue(),
			// 	enableSorting: true,
			// 	enableGrouping: true,
			// 	enableResizing: true,
			// 	size: 200,
			// 	minSize: 200,
			// }),
			{
				id: 'actions',
				header: '操作',
				cell: ({ row }: { row: any }) => row.original.id,
				enableSorting: false,
				enableGrouping: false,
				enableResizing: false,
				size: 120,
				minSize: 120,
				maxSize: 120,
			},
		],
		[],
	);

	// Table state management
	const [grouping, setGrouping] = useState<GroupingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [expanded, setExpanded] = useState<ExpandedState>({});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');
	const [columnVisibility, setColumnVisibility] = useState({});
	const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
		right: ['actions'],
	});

	// Filter helpers
	const setStatusFilter = useCallback((status: string | null) => {
		if (status === null) {
			setColumnFilters((prev) => prev.filter((filter) => filter.id !== 'status'));
		} else {
			setColumnFilters((prev) => [
				...prev.filter((filter) => filter.id !== 'status'),
				{ id: 'status', value: status },
			]);
		}
	}, []);

	const setCompanyFilter = useCallback((companyName: string | null) => {
		if (companyName === null || companyName === '') {
			setColumnFilters((prev) => prev.filter((filter) => filter.id !== 'companyName'));
		} else {
			setColumnFilters((prev) => [
				...prev.filter((filter) => filter.id !== 'companyName'),
				{ id: 'companyName', value: companyName },
			]);
		}
	}, []);

	const clearAllFilters = useCallback(() => {
		setColumnFilters([]);
	}, []);

	// Action handlers
	const handleVoidInvoice = useCallback(
		(invoiceId: string) => {
			onVoidInvoice?.(invoiceId);
		},
		[onVoidInvoice],
	);

	const handleEditInvoice = useCallback(
		(invoice: Invoice) => {
			onEditInvoice?.(invoice);
		},
		[onEditInvoice],
	);

	const handleMarkPaid = useCallback(
		(invoiceId: string) => {
			onMarkPaid?.(invoiceId);
		},
		[onMarkPaid],
	);

	const handleDeleteInvoice = useCallback(
		(invoiceId: string) => {
			onDeleteInvoice?.(invoiceId);
		},
		[onDeleteInvoice],
	);

	// 確保資料穩定性
	const stableData = useMemo(() => data.filter(Boolean), [data]);

	const table = useReactTable({
		data: stableData,
		columns,
		state: {
			grouping,
			columnFilters,
			expanded,
			sorting,
			columnVisibility,
			columnPinning,
		},
		autoResetPageIndex: false,
		onColumnFiltersChange: setColumnFilters,
		onGroupingChange: setGrouping,
		onExpandedChange: setExpanded,
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnPinningChange: setColumnPinning,
		columnResizeMode,
		columnResizeDirection,
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getRowCanExpand: (row) => !!(row.original.waybills && row.original.waybills.length > 0),
		getRowId: (row) => row.id,
		enableColumnResizing: true,
		enableGrouping: true,
		enableSorting: true,
		enableFilters: true,
		enableHiding: true,
		enablePinning: true,
		globalFilterFn: 'includesString',
		debugTable: false,
		debugHeaders: false,
		debugColumns: false,
	});

	// Table statistics - 基於篩選後的資料
	const tableStats = useMemo(() => {
		// 使用 table.getFilteredRowModel() 獲取篩選後的資料
		// 需要在 useMemo 內部調用以確保響應性
		let filteredInvoices = stableData;
		try {
			filteredInvoices = table.getFilteredRowModel().rows.map((row) => row.original);
		} catch (e) {
			// 如果 getFilteredRowModel 失敗，使用原始數據
			filteredInvoices = stableData;
		}

		// 排除已作廢的發票
		const validInvoices = filteredInvoices.filter((invoice) => invoice.status !== 'void');

		const totalInvoices = stableData.length;
		const issuedInvoices = stableData.filter((invoice) => invoice.status === 'issued').length;
		const paidInvoices = stableData.filter((invoice) => invoice.status === 'paid').length;
		const voidInvoices = stableData.filter((invoice) => invoice.status === 'void').length;

		// 有效發票（不含作廢）的統計
		const validInvoiceCount = validInvoices.length;
		const validTotalAmount = validInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
		const validTotalTax = validInvoices.reduce((sum, invoice) => sum + invoice.tax, 0);

		const totalAmount = stableData.reduce((sum, invoice) => sum + invoice.total, 0);
		const paidAmount = stableData
			.filter((invoice) => invoice.status === 'paid')
			.reduce((sum, invoice) => sum + invoice.total, 0);
		const outstandingAmount = stableData
			.filter((invoice) => invoice.status === 'issued')
			.reduce((sum, invoice) => sum + invoice.total, 0);

		return {
			totalInvoices,
			issuedInvoices,
			paidInvoices,
			voidInvoices,
			totalAmount,
			paidAmount,
			outstandingAmount,
			// 新增：有效發票統計（排除作廢，響應篩選）
			validInvoiceCount,
			validTotalAmount,
			validTotalTax,
		};
	}, [stableData, table]);

	// Get available filter options
	const filterOptions = useMemo(() => {
		const statuses = Array.from(new Set(stableData.map((invoice) => invoice.status)));
		const companies = Array.from(new Set(stableData.map((invoice) => invoice.companyName)));

		return {
			statuses,
			companies,
		};
	}, [stableData]);

	return {
		table,
		columns,
		// State setters
		setGrouping,
		setColumnFilters,
		setExpanded,
		setSorting,
		setColumnVisibility,
		// Filter helpers
		setStatusFilter,
		setCompanyFilter,
		clearAllFilters,
		// Action handlers
		handleVoidInvoice,
		handleEditInvoice,
		handleMarkPaid,
		handleDeleteInvoice,
		// Statistics and options
		tableStats,
		filterOptions,
		// Current filter states
		currentFilters: {
			status: columnFilters.find((f) => f.id === 'status')?.value as string | undefined,
			company: columnFilters.find((f) => f.id === 'companyName')?.value as string | undefined,
		},
	};
}
