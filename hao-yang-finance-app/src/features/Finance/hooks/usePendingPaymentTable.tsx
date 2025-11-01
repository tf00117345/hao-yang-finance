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

import { Waybill } from '../../Waybill/types/waybill.types';

const columnHelper = createColumnHelper<Waybill>();

export function usePendingPaymentTable(data: Waybill[]) {
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
				size: 60,
				minSize: 60,
				maxSize: 60,
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

					const searchableText = rowDate.toLowerCase();

					return searchTerms.every((term) => {
						if (searchableText.includes(term)) return true;

						if (term.endsWith('月')) {
							const month = term.slice(0, -1).padStart(2, '0');
							if (searchableText.includes(`-${month}-`)) return true;
						}

						if (term.includes('/')) {
							const normalized = term.replace('/', '-');
							if (searchableText.includes(normalized)) return true;
						}

						return false;
					});
				},
			}),
			// columnHelper.accessor('waybillNumber', {
			// 	header: '託運單號',
			// 	cell: (info) => info.getValue(),
			// 	enableSorting: true,
			// 	enableGrouping: false,
			// 	enableColumnFilter: true,
			// 	enableResizing: true,
			// 	filterFn: 'includesString',
			// 	size: 120,
			// 	minSize: 100,
			// 	maxSize: 180,
			// }),
			columnHelper.accessor('driverName', {
				header: '司機',
				cell: (info) => info.getValue(),
				enableSorting: true,
				enableGrouping: true,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 100,
				minSize: 80,
				maxSize: 150,
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
				cell: (info) => {
					const value = info.getValue();
					if (value == null) return '';
					return value.toLocaleString();
				},
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: true,
				enableResizing: true,
				size: 100,
				minSize: 80,
				maxSize: 150,
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue) return true;
					const value = row.getValue(columnId) as number;
					if (value == null) return false;
					return value.toString().includes(filterValue);
				},
			}),
			columnHelper.accessor('notes', {
				header: '備註',
				cell: (info) => info.getValue() || '',
				enableSorting: false,
				enableGrouping: false,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 150,
				minSize: 120,
				maxSize: 300,
			}),
			{
				id: 'actions',
				header: '操作',
				cell: 'actions',
				enableSorting: false,
				enableGrouping: false,
				enableColumnFilter: false,
				enableResizing: false,
				size: 80,
				minSize: 80,
				maxSize: 80,
			},
		],
		[],
	);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [grouping, setGrouping] = useState<GroupingState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			grouping,
			rowSelection,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGroupingChange: setGrouping,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		columnResizeMode: 'onChange' as ColumnResizeMode,
		columnResizeDirection: 'ltr' as ColumnResizeDirection,
		enableRowSelection: true,
		getRowId: (row) => row.id,
	});

	return {
		table,
		columnFilters,
		setColumnFilters,
	};
}
