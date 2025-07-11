import { Box, Chip } from '@mui/material';
import type { ColDef } from 'ag-grid-community';
import { CustomCellRendererProps } from 'ag-grid-react';

import { toCapitalize } from '../../../../utils/string-utils';

export default function StatusChipCell(params: CustomCellRendererProps) {
	const { cellRendererParams } = params.colDef as ColDef;

	const color = cellRendererParams?.[params.value] || 'text';

	return (
		<Box
			sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', height: '100%' }}
		>
			<Chip size="small" color={color} label={toCapitalize(params.value)} />
		</Box>
	);
}
