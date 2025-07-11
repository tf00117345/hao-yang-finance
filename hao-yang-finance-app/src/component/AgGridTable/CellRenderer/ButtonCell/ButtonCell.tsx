import { Box, Button } from '@mui/material';
import type { ColDef } from 'ag-grid-community';
import { CustomCellRendererProps } from 'ag-grid-react';

export default function ButtonCell(params: CustomCellRendererProps) {
	const { cellRendererParams } = params.colDef as ColDef;

	const label = cellRendererParams?.label || 'Button';
	const variant = cellRendererParams?.variant || 'contained';
	const color = cellRendererParams?.color || 'primary';
	const onClick = cellRendererParams?.onClick;

	return (
		<Box
			sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', height: '100%' }}
		>
			<Button size="small" variant={variant} color={color} onClick={() => onClick(params.data)}>
				{label}
			</Button>
		</Box>
	);
}
