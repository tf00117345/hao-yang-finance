import { useMutation } from '@tanstack/react-query';
import { deleteWaybill, insertWaybill, updateWaybill, markWaybillAsNoInvoiceNeeded, restoreWaybill } from './api';
import { queryClient } from '../../../App';
import { useNotifications } from '../../../hooks/useNotifications';

// 更新託運單
export const useUpdateWaybillMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();
	
	return useMutation({
		mutationFn: updateWaybill,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單更新成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

// 新增託運單
export const useInsertWaybillMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();
	
	return useMutation({
		mutationFn: insertWaybill,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單建立成功');
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
			queryClient.invalidateQueries({ queryKey: ['waybills'], exact: false });
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
			queryClient.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單已標記為不需開發票');
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
			queryClient.invalidateQueries({ queryKey: ['waybills'], exact: false });
			notifySuccess('託運單已還原為待處理狀態');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};
