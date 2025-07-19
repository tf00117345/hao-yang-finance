import { useMemo } from 'react';

import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { InvoiceWaybill } from '../types/invoice.type';

const columnHelper = createColumnHelper<InvoiceWaybill>();

export function useWaybillSubTable(data: InvoiceWaybill[], invoiceId: string) {
	const columns = useMemo(
		() => [
			// columnHelper.accessor('waybillId', {
			// 	header: '貨運單ID',
			// 	cell: (info) => info.getValue(),
			// }),
			columnHelper.accessor('waybillNumber', {
				header: '貨運單編號',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('date', {
				header: '日期',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('item', {
				header: '貨物',
				cell: (info) => info.getValue(),
			}),
			columnHelper.accessor('fee', {
				header: '金額',
				cell: (info) => info.getValue()?.toLocaleString() || '0',
			}),
			columnHelper.accessor('driverName', {
				header: '司機',
				cell: (info) => info.getValue(),
			}),
		],
		[],
	);

	// 確保資料穩定性
	const stableData = useMemo(() => data.filter(Boolean), [data]);

	const table = useReactTable({
		data: stableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => `${invoiceId}-${row.waybillId}`, // 使用 invoiceId 前綴來避免 ID 衝突
	});

	return { table, columns };
}
