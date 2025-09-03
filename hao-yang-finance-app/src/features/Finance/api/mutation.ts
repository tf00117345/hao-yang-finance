import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSnackbar } from '../../../contexts/SnackbarContext';
import { CreateInvoiceRequest, MarkInvoicePaidRequest, UpdateInvoiceRequest } from '../types/invoice.type';
import { createInvoice, deleteInvoice, markInvoicePaid, restoreInvoice, updateInvoice, voidInvoice } from './api';

// 建立發票 mutation
export const useCreateInvoiceMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: (data: CreateInvoiceRequest) => createInvoice(data),
		onSuccess: (data, variables) => {
			showSuccessMessage('發票建立成功');

			// 無效化相關的查詢
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
			queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
			queryClient.invalidateQueries({ queryKey: ['last-invoice-number'] });
		},
		onError: (error: any) => {
			const errors = error?.response?.data?.errors;
			let message = error?.response?.data?.message || '建立發票失敗';
			if (errors) {
				message += `：${errors.join(', ')}`;
			}
			showErrorMessage(message);
		},
	});
};

// 更新發票 mutation
export const useUpdateInvoiceMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) => updateInvoice(id, data),
		onSuccess: (data, variables) => {
			showSuccessMessage('發票更新成功');

			// 無效化相關的查詢
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
			queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
		},
		onError: (error: any) => {
			const errors = error?.response?.data?.errors;
			let message = error?.response?.data?.message || '更新發票失敗';
			if (errors) {
				message += `：${errors.join(', ')}`;
			}
			showErrorMessage(message);
		},
	});
};

// 刪除發票 mutation
export const useDeleteInvoiceMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: (id: string) => deleteInvoice(id),
		onSuccess: (data, variables) => {
			showSuccessMessage('發票刪除成功');

			// 無效化相關的查詢
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
			queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
			queryClient.invalidateQueries({ queryKey: ['last-invoice-number'] });

			// 移除特定發票的查詢快取
			queryClient.removeQueries({ queryKey: ['invoice', variables] });
		},
		onError: (error: any) => {
			const errors = error?.response?.data?.errors;
			let message = error?.response?.data?.message || '刪除發票失敗';
			if (errors) {
				message += `：${errors.join(', ')}`;
			}
			showErrorMessage(message);
		},
	});
};

// 標記收款 mutation
export const useMarkInvoicePaidMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: MarkInvoicePaidRequest }) => markInvoicePaid(id, data),
		onSuccess: (data, variables) => {
			showSuccessMessage('發票已標記為已收款');

			// 無效化相關的查詢
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
			queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
		},
		onError: (error: any) => {
			const errors = error?.response?.data?.errors;
			let message = error?.response?.data?.message || '標記收款失敗';
			if (errors) {
				message += `：${errors.join(', ')}`;
			}
			showErrorMessage(message);
		},
	});
};

// 作廢發票 mutation
export const useVoidInvoiceMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: (id: string) => voidInvoice(id),
		onSuccess: (data, variables) => {
			showSuccessMessage('發票已成功作廢');

			// 無效化相關的查詢
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['invoice', variables] });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
			queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
		},
		onError: (error: any) => {
			const errors = error?.response?.data?.errors;
			let message = error?.response?.data?.message || '作廢發票失敗';
			if (errors) {
				message += `：${errors.join(', ')}`;
			}
			showErrorMessage(message);
		},
	});
};

// 恢復發票 mutation
export const useRestoreInvoiceMutation = () => {
	const queryClient = useQueryClient();
	const { showSuccessMessage, showErrorMessage } = useSnackbar();

	return useMutation({
		mutationFn: (id: string) => restoreInvoice(id),
		onSuccess: (data, variables) => {
			showSuccessMessage('發票已成功恢復');

			// 無效化相關的查詢
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
			queryClient.invalidateQueries({ queryKey: ['invoice', variables] });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
			queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
		},
		onError: (error: any) => {
			const errors = error?.response?.data?.errors;
			let message = error?.response?.data?.message || '恢復發票失敗';
			if (errors) {
				message += `：${errors.join(', ')}`;
			}
			showErrorMessage(message);
		},
	});
};
