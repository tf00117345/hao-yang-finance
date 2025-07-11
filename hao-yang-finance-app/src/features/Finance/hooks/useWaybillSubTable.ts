import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Waybill } from '../../Waybill/types/waybill.types';

const columnHelper = createColumnHelper<Waybill>();

export function useWaybillSubTable(data: Waybill[], invoiceId: string) {
	const columns = useMemo(
		() => [
			columnHelper.accessor('id', {
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
		getRowId: (row) => `${invoiceId}-${row.id}`, // 使用 invoiceId 前綴來避免 ID 衝突
	});

	return { table, columns };
}
