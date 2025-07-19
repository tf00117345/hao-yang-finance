import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSnackbar } from '../../../contexts/SnackbarContext';
import { UpdateCompanyDto } from '../types/company';
import { UpdateDriverDto } from '../types/driver';
import { deleteCompany, deleteDriver, insertCompany, insertDriver, updateCompany, updateDriver } from './api';

export const useDeleteCompanyMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: deleteCompany,
		onSuccess: () => {
			showSuccessMessage('公司刪除成功');
			queryClient.invalidateQueries({ queryKey: ['companies'] });
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || '刪除公司失敗';
			showErrorMessage(message);
		},
	});
};

export const useInsertCompanyMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: insertCompany,
		onSuccess: () => {
			showSuccessMessage('公司新增成功');
			queryClient.invalidateQueries({ queryKey: ['companies'] });
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || '新增公司失敗';
			showErrorMessage(message);
		},
	});
};

export const useUpdateCompanyMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: ({ id, company }: { id: string; company: UpdateCompanyDto }) => updateCompany(id, company),
		onSuccess: () => {
			showSuccessMessage('公司資料更新成功');
			queryClient.invalidateQueries({ queryKey: ['companies'] });
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || '更新公司失敗';
			showErrorMessage(message);
		},
	});
};

export const useInsertDriverMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: insertDriver,
		onSuccess: () => {
			showSuccessMessage('司機新增成功');
			queryClient.invalidateQueries({ queryKey: ['drivers'] });
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || '新增司機失敗';
			showErrorMessage(message);
		},
	});
};

export const useUpdateDriverMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: ({ id, driver }: { id: string; driver: UpdateDriverDto }) => updateDriver(id, driver),
		onSuccess: () => {
			showSuccessMessage('司機資料更新成功');
			queryClient.invalidateQueries({ queryKey: ['drivers'] });
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || '更新司機失敗';
			showErrorMessage(message);
		},
	});
};

export const useDeleteDriverMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: deleteDriver,
		onSuccess: () => {
			showSuccessMessage('司機刪除成功');
			queryClient.invalidateQueries({ queryKey: ['drivers'] });
		},
		onError: (error: any) => {
			const message = error?.response?.data?.message || '刪除司機失敗';
			showErrorMessage(message);
		},
	});
};
