import { Chip } from '@mui/material';
import type { CustomCellRendererProps } from 'ag-grid-react';

export default function UserStatusCell(params: CustomCellRendererProps) {
	return <Chip label={params.value ? '啟用' : '停用'} color={params.value ? 'success' : 'default'} size="small" />;
}
