import React from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import { Invoice } from '../../types/invoice.type';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useWaybillSubTable } from '../../hooks/useWaybillSubTable';

interface InvoicedWaybillSubTableProps {
	invoice: Invoice;
	waybillMap: Record<string, Waybill>;
}

const InvoicedWaybillSubTable = React.memo(function InvoicedWaybillSubTable({
	invoice,
	waybillMap,
}: InvoicedWaybillSubTableProps) {
	const subRows = React.useMemo(
		() => invoice.waybillIds.map((bid) => waybillMap[bid]).filter(Boolean),
		[invoice.waybillIds, waybillMap],
	);

	const { table: subTable } = useWaybillSubTable(subRows, invoice.id);

	// 如果沒有子資料，顯示提示訊息
	if (subRows.length === 0) {
		return (
			<Box sx={{ m: 2 }}>
				<Typography variant="subtitle2" sx={{ mb: 1 }}>
					關聯貨運單：
				</Typography>
				<Typography variant="body2" color="text.secondary">
					沒有關聯的貨運單資料
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ m: 2 }}>
			<Typography variant="subtitle2" sx={{ mb: 1 }}>
				關聯貨運單：
			</Typography>
			<Table size="small">
				<TableHead>
					{subTable.getHeaderGroups().map((headerGroup) => (
						<TableRow key={`${invoice.id}-header-${headerGroup.id}`}>
							{headerGroup.headers.map((header) => (
								<TableCell key={`${invoice.id}-header-cell-${header.id}`}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableHead>
				<TableBody>
					{subTable.getRowModel().rows.map((row) => (
						<TableRow key={`${invoice.id}-row-${row.id}`}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={`${invoice.id}-cell-${cell.id}`}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Box>
	);
});

export default InvoicedWaybillSubTable;
