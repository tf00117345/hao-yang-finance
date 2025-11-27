import { useMemo, useState } from 'react';

import { Chip } from '@mui/material';
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
import { format } from 'date-fns';

import {
	CollectionRequest,
	CollectionRequestStatus,
	CollectionRequestStatusColors,
	CollectionRequestStatusLabels,
} from '../types/collection-request.types';

const columnHelper = createColumnHelper<CollectionRequest>();

// 格式化貨幣
const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('zh-TW', {
		style: 'currency',
		currency: 'TWD',
		minimumFractionDigits: 0,
	}).format(amount);
};

export function useCollectionRequestTable(data: CollectionRequest[]) {
	const columns = useMemo(
		() => [
			columnHelper.accessor('requestNumber', {
				header: '請款單號',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 150,
				minSize: 120,
				maxSize: 200,
			}),
			columnHelper.accessor('requestDate', {
				header: '請款日期',
				cell: (info) => format(new Date(info.getValue()), 'yyyy/MM/dd'),
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				size: 120,
				minSize: 100,
				maxSize: 150,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const rowDate = row.getValue(columnId) as string;
					const formattedDate = format(new Date(rowDate), 'yyyy/MM/dd');
					const searchTerms = filterValue
						.toLowerCase()
						.split(/\s+/)
						.filter((term) => term.length > 0);

					const searchableText = formattedDate.toLowerCase();

					return searchTerms.every((term) => {
						if (searchableText.includes(term)) return true;

						// 支援中文月份格式 (如 "1月" 轉換為 "01")
						if (term.endsWith('月')) {
							const month = term.slice(0, -1).padStart(2, '0');
							if (searchableText.includes(`/${month}/`)) return true;
						}

						return false;
					});
				},
			}),
			columnHelper.accessor('companyName', {
				header: '公司名稱',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 180,
				minSize: 120,
				maxSize: 300,
			}),
			columnHelper.accessor('subtotal', {
				header: '小計',
				cell: (info) => formatCurrency(info.getValue()),
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				sortingFn: 'basic',
				size: 120,
				minSize: 100,
				maxSize: 150,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const amount = row.getValue(columnId) as number;
					if (amount === null || amount === undefined) return false;

					const cleanValue = filterValue.trim().replace(/[,，]/g, '');

					// 處理範圍搜尋
					if (cleanValue.startsWith('>=')) {
						const minValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(minValue) && amount >= minValue;
					}
					if (cleanValue.startsWith('>')) {
						const minValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(minValue) && amount > minValue;
					}
					if (cleanValue.startsWith('<=')) {
						const maxValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(maxValue) && amount <= maxValue;
					}
					if (cleanValue.startsWith('<')) {
						const maxValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(maxValue) && amount < maxValue;
					}

					// 處理區間搜尋
					const rangeMatch = cleanValue.match(/^(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)$/);
					if (rangeMatch) {
						const [, minStr, maxStr] = rangeMatch;
						const minValue = parseFloat(minStr);
						const maxValue = parseFloat(maxStr);
						return (
							!Number.isNaN(minValue) &&
							!Number.isNaN(maxValue) &&
							amount >= minValue &&
							amount <= maxValue
						);
					}

					// 精確數字搜尋
					const numericValue = parseFloat(cleanValue);
					if (!Number.isNaN(numericValue)) {
						return amount === numericValue;
					}

					return formatCurrency(amount).toLowerCase().includes(filterValue.toLowerCase());
				},
			}),
			columnHelper.accessor('taxAmount', {
				header: '稅額',
				cell: (info) => formatCurrency(info.getValue()),
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				sortingFn: 'basic',
				size: 100,
				minSize: 80,
				maxSize: 130,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const amount = row.getValue(columnId) as number;
					if (amount === null || amount === undefined) return false;

					const cleanValue = filterValue.trim().replace(/[,，]/g, '');

					if (cleanValue.startsWith('>=')) {
						const minValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(minValue) && amount >= minValue;
					}
					if (cleanValue.startsWith('>')) {
						const minValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(minValue) && amount > minValue;
					}
					if (cleanValue.startsWith('<=')) {
						const maxValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(maxValue) && amount <= maxValue;
					}
					if (cleanValue.startsWith('<')) {
						const maxValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(maxValue) && amount < maxValue;
					}

					const rangeMatch = cleanValue.match(/^(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)$/);
					if (rangeMatch) {
						const [, minStr, maxStr] = rangeMatch;
						const minValue = parseFloat(minStr);
						const maxValue = parseFloat(maxStr);
						return (
							!Number.isNaN(minValue) &&
							!Number.isNaN(maxValue) &&
							amount >= minValue &&
							amount <= maxValue
						);
					}

					const numericValue = parseFloat(cleanValue);
					if (!Number.isNaN(numericValue)) {
						return amount === numericValue;
					}

					return formatCurrency(amount).toLowerCase().includes(filterValue.toLowerCase());
				},
			}),
			columnHelper.accessor('totalAmount', {
				header: '總計',
				cell: (info) => formatCurrency(info.getValue()),
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				sortingFn: 'basic',
				size: 130,
				minSize: 100,
				maxSize: 160,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const amount = row.getValue(columnId) as number;
					if (amount === null || amount === undefined) return false;

					const cleanValue = filterValue.trim().replace(/[,，]/g, '');

					if (cleanValue.startsWith('>=')) {
						const minValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(minValue) && amount >= minValue;
					}
					if (cleanValue.startsWith('>')) {
						const minValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(minValue) && amount > minValue;
					}
					if (cleanValue.startsWith('<=')) {
						const maxValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(maxValue) && amount <= maxValue;
					}
					if (cleanValue.startsWith('<')) {
						const maxValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(maxValue) && amount < maxValue;
					}

					const rangeMatch = cleanValue.match(/^(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)$/);
					if (rangeMatch) {
						const [, minStr, maxStr] = rangeMatch;
						const minValue = parseFloat(minStr);
						const maxValue = parseFloat(maxStr);
						return (
							!Number.isNaN(minValue) &&
							!Number.isNaN(maxValue) &&
							amount >= minValue &&
							amount <= maxValue
						);
					}

					const numericValue = parseFloat(cleanValue);
					if (!Number.isNaN(numericValue)) {
						return amount === numericValue;
					}

					return formatCurrency(amount).toLowerCase().includes(filterValue.toLowerCase());
				},
			}),
			columnHelper.accessor('waybillCount', {
				header: '託運單數',
				cell: (info) => <Chip label={`${info.getValue()} 筆`} size="small" />,
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				sortingFn: 'basic',
				size: 100,
				minSize: 80,
				maxSize: 120,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const count = row.getValue(columnId) as number;
					const cleanValue = filterValue.trim();

					if (cleanValue.startsWith('>=')) {
						const minValue = parseInt(cleanValue.slice(2), 10);
						return !Number.isNaN(minValue) && count >= minValue;
					}
					if (cleanValue.startsWith('>')) {
						const minValue = parseInt(cleanValue.slice(1), 10);
						return !Number.isNaN(minValue) && count > minValue;
					}
					if (cleanValue.startsWith('<=')) {
						const maxValue = parseInt(cleanValue.slice(2), 10);
						return !Number.isNaN(maxValue) && count <= maxValue;
					}
					if (cleanValue.startsWith('<')) {
						const maxValue = parseInt(cleanValue.slice(1), 10);
						return !Number.isNaN(maxValue) && count < maxValue;
					}

					const numericValue = parseInt(cleanValue, 10);
					if (!Number.isNaN(numericValue)) {
						return count === numericValue;
					}

					return false;
				},
			}),
			columnHelper.accessor('status', {
				header: '狀態',
				cell: (info) => {
					const status = info.getValue();
					return (
						<Chip
							label={CollectionRequestStatusLabels[status]}
							color={CollectionRequestStatusColors[status]}
							size="small"
						/>
					);
				},
				enableSorting: true,
				enableColumnFilter: true,
				enableResizing: true,
				size: 120,
				minSize: 100,
				maxSize: 150,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const status = row.getValue(columnId) as CollectionRequestStatus;
					const statusLabel = CollectionRequestStatusLabels[status];

					// 支援用 value 或 label 搜尋
					return (
						status.toLowerCase().includes(filterValue.toLowerCase()) ||
						statusLabel.toLowerCase().includes(filterValue.toLowerCase())
					);
				},
			}),
			{
				id: 'actions',
				header: '操作',
				cell: 'actions',
				enableSorting: false,
				enableColumnFilter: false,
				enableResizing: false,
				size: 120,
			},
		],
		[],
	);

	// Table state management
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

	const table = useReactTable({
		data,
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
		enableSorting: true,
		enableColumnResizing: true,
		enableColumnFilters: true,
		// Resize configuration
		columnResizeMode,
		columnResizeDirection,
		// Row models
		getSortedRowModel: getSortedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		debugTable: false,
		debugHeaders: false,
		debugColumns: false,
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
