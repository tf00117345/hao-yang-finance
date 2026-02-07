import { useMutation } from '@tanstack/react-query';

import { QueryClientInstance } from '../../../cache/queryClient';
import { useNotifications } from '../../../hooks/useNotifications';
import {
	deleteWaybill,
	insertWaybill,
	updateWaybill,
	markWaybillAsNoInvoiceNeeded,
	markWaybillAsUnpaidWithTax,
	markWaybillAsPaidWithTax,
	togglePaymentStatus,
	updatePaymentNotes,
	restoreWaybill,
	markWaybillsAsNoInvoiceNeededBatch,
	restoreWaybillsBatch,
	markWaybillsAsUnpaidWithTaxBatch,
	saveWaybillFeeSplits,
} from './api';

// 更新託運單
export const useUpdateWaybillMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: updateWaybill,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單更新成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 新增託運單
export const useInsertWaybillMutation = (onSuccessCallback: () => void) => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: insertWaybill,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單建立成功');
			onSuccessCallback();
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 刪除託運單
export const useDeleteWaybillMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: deleteWaybill,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單刪除成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 標記為不需開發票
export const useMarkWaybillAsNoInvoiceNeededMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: markWaybillAsNoInvoiceNeeded,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單已標記為不需開發票');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 標記為未收款
export const useMarkWaybillAsUnpaidWithTaxMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: markWaybillAsUnpaidWithTax,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單已標記為未收款');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 標記為已收款
export const useMarkWaybillAsPaidWithTaxMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: markWaybillAsPaidWithTax,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單已標記為已收款');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 切換收款狀態
export const useTogglePaymentStatusMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: togglePaymentStatus,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('收款狀態已切換');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 更新收款備註
export const useUpdatePaymentNotesMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: updatePaymentNotes,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('收款備註已更新');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 還原託運單
export const useRestoreWaybillMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: restoreWaybill,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單已還原為待處理狀態');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 批次標記為不需開發票
export const useMarkWaybillsAsNoInvoiceNeededBatchMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: markWaybillsAsNoInvoiceNeededBatch,
		onSuccess: (data) => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			const { summary } = data;
			notifySuccess(`批次標記完成：成功 ${summary.success} 筆，失敗 ${summary.failure} 筆`);
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 批次還原託運單
export const useRestoreWaybillsBatchMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: restoreWaybillsBatch,
		onSuccess: (data) => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			const { summary } = data;
			notifySuccess(`批次還原完成：成功 ${summary.success} 筆，失敗 ${summary.failure} 筆`);
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 批次標記為未收款
export const useMarkWaybillsAsUnpaidWithTaxBatchMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: markWaybillsAsUnpaidWithTaxBatch,
		onSuccess: (data) => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			const { summary } = data;
			notifySuccess(`批次標記完成：成功 ${summary.success} 筆，失敗 ${summary.failure} 筆`);
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 儲存運費分攤
export const useSaveWaybillFeeSplitsMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: saveWaybillFeeSplits,
		onSuccess: () => {
			QueryClientInstance.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('運費分攤已儲存');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};
