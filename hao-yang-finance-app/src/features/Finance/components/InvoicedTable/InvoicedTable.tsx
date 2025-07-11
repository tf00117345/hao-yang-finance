import React, { useMemo } from 'react';
import {
	Box,
	Button,
	Collapse,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { flexRender } from '@tanstack/react-table';
import { Invoice } from '../../types/invoice.type';
import { Waybill } from '../../../Waybill/types/waybill.types';
import { useInvoiceTable } from '../../hooks/useInvoiceTable';
import { StyledTableCell, StyledTableRow } from '../styles/styles';
import InvoicedWaybillSubTable from '../InvoiceWaybillSubTable/InvoiceWaybillSubTable';

interface InvoicedTableProps {
	invoices: Invoice[];
	waybills: Waybill[];
}

export function InvoicedTable({ invoices, waybills }: InvoicedTableProps) {
	// waybill map for invoice details
	const waybillMap = useMemo(() => {
		const map: Record<string, Waybill> = {};
		waybills.forEach((b) => {
			if (b.id) map[b.id] = b;
		});
		return map;
	}, [waybills]);

	// 處理作廢發票
	function handleVoidInvoice(invoiceId: string) {
		// const now = new Date().toISOString();
		// setInvoices((prev) =>
		// 	prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'void', voidAt: now, updatedAt: now } : inv)),
		// );
		// 還原 waybill 狀態
		// setWaybills((prev) =>
		// 	prev.map((b) => (b.invoiceId === invoiceId ? { ...b, isInvoiceIssued: false, invoiceId: undefined } : b)),
		// );
	}

	const { table } = useInvoiceTable(invoices, handleVoidInvoice);

	return (
		<Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
			<Typography sx={{ px: 2, mb: 2 }} variant="h6">
				已開立發票清單
			</Typography>
			<TableContainer
				component={Paper}
				sx={{
					flex: 1,
					overflow: 'auto',
					border: '1px solid #E0E0E0',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Table stickyHeader>
					<TableHead>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<StyledTableCell key={header.id} size="small">
										{header.id === 'expander' ? (
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<span style={{ marginLeft: 24 }}>
													{flexRender(header.column.columnDef.header, header.getContext())}
												</span>
											</Box>
										) : header.isPlaceholder ? null : (
											flexRender(header.column.columnDef.header, header.getContext())
										)}
									</StyledTableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<React.Fragment key={row.id}>
								<StyledTableRow>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} size="small">
											{cell.column.id === 'expander' ? (
												<Box sx={{ display: 'flex', alignItems: 'center' }}>
													<IconButton
														size="small"
														onClick={row.getToggleExpandedHandler()}
														disabled={!row.getCanExpand()}
													>
														{row.getIsExpanded() ? (
															<ExpandMoreIcon />
														) : (
															<ChevronRightIcon />
														)}
													</IconButton>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</Box>
											) : cell.column.id === 'actions' ? (
												<Button
													variant="outlined"
													size="small"
													disabled={row.original.status === 'void'}
													onClick={() => handleVoidInvoice(row.original.id)}
												>
													作廢
												</Button>
											) : (
												flexRender(cell.column.columnDef.cell, cell.getContext())
											)}
										</TableCell>
									))}
								</StyledTableRow>
								{row.getIsExpanded() && (
									<TableRow>
										<TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
											<Collapse in={row.getIsExpanded()} timeout="auto" unmountOnExit>
												<InvoicedWaybillSubTable
													invoice={row.original}
													waybillMap={waybillMap}
												/>
											</Collapse>
										</TableCell>
									</TableRow>
								)}
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
}
