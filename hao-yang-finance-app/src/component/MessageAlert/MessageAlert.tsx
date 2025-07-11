import { Alert, Snackbar } from '@mui/material';
import { useRecoilState } from 'recoil';

import { snackbarState } from '../../stores/snackbarAtom';

function MessageAlert() {
	const [snackbar, setSnackbar] = useRecoilState(snackbarState);

	const handleClose = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	return (
		<Snackbar
			open={snackbar.open}
			autoHideDuration={3000}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			onClose={handleClose}
		>
			<Alert onClose={handleClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
				{snackbar.message}
			</Alert>
		</Snackbar>
	);
}

export default MessageAlert;
