import { useMemo, useState } from 'react';

import { Chip, Stack, Tooltip, Typography } from '@mui/material';
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
	RowSelectionState,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';

import { ExtraExpense, Waybill } from '../../Waybill/types/waybill.types';

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
				enableColumnFilter: false,
				enableResizing: false,
				size: 40,
			},
			columnHelper.accessor('companyName', {
				header: '客戶名稱',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: true,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 150,
				minSize: 120,
				maxSize: 250,
			}),
			columnHelper.accessor('date', {
				header: '日期',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: true,
				enableResizing: true,
				size: 120,
				minSize: 100,
				maxSize: 150,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const rowDate = row.getValue(columnId) as string;
					const searchTerms = filterValue
						.toLowerCase()
						.split(/\s+/)
						.filter((term) => term.length > 0);

					// 支援多種格式搜尋：
					// 1. 原始日期字串 (如 "2024-01-15")
					// 2. 年份 (如 "2024")
					// 3. 月份 (如 "01", "1月")
					// 4. 日期組合 (如 "2024-01", "01-15")
					const searchableText = rowDate.toLowerCase();

					return searchTerms.every((term) => {
						// 直接包含搜尋詞
						if (searchableText.includes(term)) return true;

						// 支援中文月份格式 (如 "1月" 轉換為 "01")
						if (term.endsWith('月')) {
							const month = term.slice(0, -1).padStart(2, '0');
							if (searchableText.includes(`-${month}-`)) return true;
						}

						// 支援部分年月格式 (如 "2024/1" 搜尋 "2024-01")
						if (term.includes('/')) {
							const normalized = term.replace('/', '-');
							if (searchableText.includes(normalized)) return true;
						}

						return false;
					});
				},
			}),
			columnHelper.accessor('loadingLocations', {
				header: '地點',
				enableGrouping: false,
				enableSorting: false,
				enableColumnFilter: false,
				enableResizing: true,
				size: 160,
				minSize: 120,
				maxSize: 250,
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
			columnHelper.accessor('fee', {
				header: '金額',
				cell: (info) => info.getValue()?.toLocaleString() || '0',
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: true,
				enableResizing: true,
				sortingFn: 'basic',
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;

					const fee = row.getValue(columnId) as number;
					if (fee === null || fee === undefined) return false;

					const searchValue = filterValue.trim().toLowerCase();

					// 支援多種搜尋格式：
					// 1. 直接數字 (如 "1000")
					// 2. 範圍搜尋 (如 ">1000", ">=1000", "<5000", "<=5000")
					// 3. 區間搜尋 (如 "1000-5000", "1000~5000")
					// 4. 包含千分位符號 (如 "1,000")

					// 移除千分位符號處理
					const cleanValue = searchValue.replace(/[,，]/g, '');

					// 處理範圍搜尋
					if (cleanValue.startsWith('>=')) {
						const minValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(minValue) && fee >= minValue;
					}
					if (cleanValue.startsWith('>')) {
						const minValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(minValue) && fee > minValue;
					}
					if (cleanValue.startsWith('<=')) {
						const maxValue = parseFloat(cleanValue.slice(2));
						return !Number.isNaN(maxValue) && fee <= maxValue;
					}
					if (cleanValue.startsWith('<')) {
						const maxValue = parseFloat(cleanValue.slice(1));
						return !Number.isNaN(maxValue) && fee < maxValue;
					}

					// 處理區間搜尋
					const rangeMatch = cleanValue.match(/^(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)$/);
					if (rangeMatch) {
						const [, minStr, maxStr] = rangeMatch;
						const minValue = parseFloat(minStr);
						const maxValue = parseFloat(maxStr);
						return !Number.isNaN(minValue) && !Number.isNaN(maxValue) && fee >= minValue && fee <= maxValue;
					}

					// 精確數字搜尋或包含搜尋
					const numericValue = parseFloat(cleanValue);
					if (!Number.isNaN(numericValue)) {
						return fee === numericValue;
					}

					// 文字包含搜尋（搜尋格式化後的金額）
					const formattedFee = fee.toLocaleString().toLowerCase();
					return formattedFee.includes(searchValue);
				},
				size: 100,
				minSize: 80,
				maxSize: 120,
			}),
			columnHelper.accessor(
				(row) => row.extraExpenses?.reduce((acc: number, expense: ExtraExpense) => +acc + +expense.fee, 0),
				{
					id: 'extraExpenses',
					header: '額外費用',
					cell: (info) => (info.getValue() || 0).toLocaleString(),
					enableSorting: true,
					enableGrouping: false,
					enableColumnFilter: true,
					enableResizing: true,
					sortingFn: 'basic',
					filterFn: (row, columnId, filterValue: string) => {
						if (!filterValue) return true;

						const extraExpenses = row.original.extraExpenses || [];
						const totalFee = extraExpenses.reduce(
							(acc: number, expense: ExtraExpense) => +acc + +expense.fee,
							0,
						);
						const searchValue = filterValue.trim().toLowerCase();

						// 支援多種搜尋方式：
						// 1. 按總金額搜尋 (同 fee 欄位的邏輯)
						// 2. 按費用項目名稱搜尋 (如 "油料", "過路費")
						// 3. 混合搜尋 (如 "油料 >100")

						// 移除千分位符號
						const cleanValue = searchValue.replace(/[,，]/g, '');

						// 檢查是否包含費用項目名稱搜尋
						const hasItemSearch = extraExpenses.some((expense) =>
							(expense.item || '').toLowerCase().includes(searchValue),
						);

						if (hasItemSearch) return true;

						// 以下與 fee 欄位相同的數字搜尋邏輯
						// 處理範圍搜尋
						if (cleanValue.startsWith('>=')) {
							const minValue = parseFloat(cleanValue.slice(2));
							return !Number.isNaN(minValue) && totalFee >= minValue;
						}
						if (cleanValue.startsWith('>')) {
							const minValue = parseFloat(cleanValue.slice(1));
							return !Number.isNaN(minValue) && totalFee > minValue;
						}
						if (cleanValue.startsWith('<=')) {
							const maxValue = parseFloat(cleanValue.slice(2));
							return !Number.isNaN(maxValue) && totalFee <= maxValue;
						}
						if (cleanValue.startsWith('<')) {
							const maxValue = parseFloat(cleanValue.slice(1));
							return !Number.isNaN(maxValue) && totalFee < maxValue;
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
								totalFee >= minValue &&
								totalFee <= maxValue
							);
						}

						// 精確數字搜尋
						const numericValue = parseFloat(cleanValue);
						if (!Number.isNaN(numericValue)) {
							return totalFee === numericValue;
						}

						// 如果總金額為0，檢查是否搜尋 "0" 或相關詞彙
						if (
							totalFee === 0 &&
							(searchValue === '0' || searchValue.includes('無') || searchValue.includes('沒有'))
						) {
							return true;
						}

						// 文字包含搜尋（搜尋格式化後的總金額）
						const formattedTotal = totalFee.toLocaleString().toLowerCase();
						return formattedTotal.includes(searchValue);
					},
					size: 100,
					minSize: 80,
					maxSize: 120,
				},
			),
			columnHelper.accessor('driverName', {
				header: '司機',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: true,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 120,
				minSize: 100,
				maxSize: 150,
			}),
			columnHelper.accessor('notes', {
				header: '備註',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
			}),
			// columnHelper.accessor('plateNumber', {
			// 	header: '車牌號碼',
			// 	cell: (info) => info.getValue(),
			// 	enableSorting: true,
			// 	enableGrouping: false,
			// 	enableColumnFilter: true,
			// 	enableResizing: true,
			// 	filterFn: 'includesString',
			// 	size: 120,
			// 	minSize: 100,
			// 	maxSize: 150,
			// }),
		],
		[],
	);

	// Table state management
	const [grouping, setGrouping] = useState<GroupingState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
	const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr');

	const table = useReactTable({
		data,
		columns,
		state: {
			grouping,
			columnFilters,
			rowSelection,
			sorting,
		},
		autoResetPageIndex: false,
		// State change handlers
		onColumnFiltersChange: setColumnFilters,
		onGroupingChange: setGrouping,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		// Features configuration
		enableRowSelection: true,
		enableSorting: true,
		enableColumnResizing: true,
		enableColumnFilters: true,
		enableGrouping: true,
		// Resize configuration
		columnResizeMode,
		columnResizeDirection,
		// Row models
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		debugTable: false,
		debugHeaders: false,
		debugColumns: false,
	});

	return {
		table,
		columns,
		rowSelection,
		// Table states for external access
		columnFilters,
		setColumnFilters,
		sorting,
		setSorting,
		grouping,
		setGrouping,
	};
}
