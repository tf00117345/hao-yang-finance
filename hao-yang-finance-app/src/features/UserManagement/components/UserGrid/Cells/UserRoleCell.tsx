import { Chip } from '@mui/material';
import type { CustomCellRendererProps } from 'ag-grid-react';

import { UserRole } from '../../../../../types/permission.types';
import { getRoleDescription } from '../../../../../utils/permissionUtils';

export default function UserRoleCell(params: CustomCellRendererProps) {
	const role = params.value as UserRole;

	const getRoleChipColor = (currentRole: UserRole) => {
		switch (currentRole) {
			case 'Admin':
				return 'error';
			case 'Manager':
				return 'warning';
			case 'Accountant':
				return 'info';
			case 'User':
				return 'default';
			default:
				return 'default';
		}
	};

	return <Chip label={getRoleDescription(role)} color={getRoleChipColor(role)} size="small" />;
}
