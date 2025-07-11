import { TableCell, TableRow, styled } from '@mui/material';

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
	'&.MuiTableCell-head': {
		backgroundColor: '#FAFAFB',
		color: '#000000',
		fontWeight: 'bold',
	},
	'&.MuiTableCell-body': {
		fontSize: 16,
	},
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
	// '&:nth-of-type(odd)': {
	// 	backgroundColor: theme.palette.action.hover,
	// },
	'&:hover': {
		backgroundColor: '#E4F2FD',
	},
}));

export const Resizer = styled('div')(({ theme }) => ({
	position: 'absolute',
	top: 0,
	height: '100%',
	width: 5,
	background: 'rgba(0, 0, 0, 0.5)',
	cursor: 'col-resize',
	userSelect: 'none',
	touchAction: 'none',
}));
