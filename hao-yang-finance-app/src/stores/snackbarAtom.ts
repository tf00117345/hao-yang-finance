import { atom } from 'recoil';

export interface SnackbarState {
	open: boolean;
	message: string;
	severity: 'success' | 'info' | 'warning' | 'error';
}

export const snackbarState = atom<SnackbarState>({
	key: 'snackbarState',
	default: {
		open: false,
		message: '',
		severity: 'info',
	},
});
