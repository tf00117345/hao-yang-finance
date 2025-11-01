import { useMemo, useState } from 'react';

import { Chip } from '@mui/material';
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

import { WaybillStatus, WaybillStatusColors, WaybillStatusLabels } from '../../Waybill/types/waybill-status.types';
import { Waybill } from '../../Waybill/types/waybill.types';

const columnHelper = createColumnHelper<Waybill & { feePlusTax?: number }>();

export function useCashPaymentTable(data: (Waybill & { feePlusTax?: number })[]) {
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
			},
			columnHelper.accessor('status', {
				header: '狀態',
				cell: (info) => {
					const status = info.getValue() as WaybillStatus;
					return (
						<Chip label={WaybillStatusLabels[status]} color={WaybillStatusColors[status]} size="small" />
					);
				},
				enableSorting: true,
				enableGrouping: true,
				enableColumnFilter: true,
				enableResizing: true,
				filterFn: 'includesString',
				size: 80,
			}),
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
				enableColumnFilter: false,
				enableResizing: true,
				size: 120,
			}),
			// columnHelper.accessor('driverName', {
			// 	header: '司機',
			// 	cell: (info) => info.getValue(),
			// 	enableSorting: true,
			// 	enableGrouping: true,
			// 	enableColumnFilter: true,
			// 	enableResizing: true,
			// 	filterFn: 'includesString',
			// 	size: 100,
			// 	minSize: 80,
			// 	maxSize: 150,
			// }),
			// columnHelper.accessor('loadingLocations', {
			// 	header: '地點',
			// 	enableGrouping: false,
			// 	enableSorting: false,
			// 	enableColumnFilter: false,
			// 	enableResizing: true,
			// 	size: 160,
			// 	minSize: 120,
			// 	maxSize: 250,
			// 	cell: ({ getValue }) => {
			// 		const locations = (getValue() as Array<{ id?: string; from: string; to: string }>).filter(
			// 			(loc) => loc.from !== '空白' && loc.to !== '空白',
			// 		);

			// 		const MAX_VISIBLE = 2;
			// 		const visible = locations.slice(0, MAX_VISIBLE);
			// 		const remaining = locations.length - visible.length;

			// 		return (
			// 			<Stack direction="row" flexWrap="wrap" gap={0.5}>
			// 				{visible.map((loc, idx) => (
			// 					<Chip
			// 						key={loc.id ?? `${loc.from}-${loc.to}-${idx}`}
			// 						label={`${loc.from} → ${loc.to}`}
			// 						size="small"
			// 						variant="outlined"
			// 					/>
			// 				))}
			// 				{remaining > 0 && (
			// 					<Tooltip
			// 						title={
			// 							<Stack sx={{ maxWidth: 360, p: 0.5 }}>
			// 								{locations.map((loc, idx) => (
			// 									<Typography
			// 										key={`full-${loc.id ?? `${loc.from}-${loc.to}-${idx}`}`}
			// 										variant="body2"
			// 									>
			// 										{loc.from} → {loc.to}
			// 									</Typography>
			// 								))}
			// 							</Stack>
			// 						}
			// 						arrow
			// 						placement="top"
			// 					>
			// 						<Chip label={`+${remaining}`} size="small" color="primary" />
			// 					</Tooltip>
			// 				)}
			// 			</Stack>
			// 		);
			// 	},
			// }),
			columnHelper.accessor('fee', {
				header: '運費',
				cell: (info) => {
					const fee = info.getValue();
					if (fee == null) return '';
					return fee.toLocaleString();
				},
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: false,
				enableResizing: true,
				size: 80,
			}),
			columnHelper.accessor('taxAmount', {
				header: '稅額',
				cell: (info) => {
					const taxAmount = info.getValue();
					if (taxAmount == null) return '';
					return taxAmount.toLocaleString();
				},
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: false,
				enableResizing: true,
				size: 60,
			}),
			columnHelper.accessor('feePlusTax', {
				header: '應收款項',
				cell: (info) => {
					const { taxAmount, fee } = info.row.original;
					if (fee == null) return '';

					const totalWithTax = taxAmount ? fee + taxAmount : fee;
					return totalWithTax.toLocaleString();
				},
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: false,
				enableResizing: true,
				size: 80,
			}),
			columnHelper.accessor('paymentReceivedAt', {
				header: '收款日期',
				cell: (info) => info.getValue() || '-',
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: false,
				enableResizing: true,
				filterFn: 'includesString',
				size: 80,
			}),
			columnHelper.accessor('paymentMethod', {
				header: '收款方式',
				cell: (info) => info.getValue() || '-',
				enableSorting: true,
				enableGrouping: false,
				enableColumnFilter: false,
				enableResizing: true,
				filterFn: 'includesString',
				size: 100,
				minSize: 80,
				maxSize: 150,
			}),
			columnHelper.accessor('paymentNotes', {
				header: '收款備註',
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
