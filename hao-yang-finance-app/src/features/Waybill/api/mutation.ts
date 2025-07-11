import { useMutation } from '@tanstack/react-query';
import { deleteWaybill, insertWaybill, updateWaybill } from './api';
import { queryClient } from '../../../App';

// 更新託運單
export const useUpdateWaybillMutation = () => {
	return useMutation({
		mutationFn: updateWaybill,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
		},
	});
};

// 新增託運單
export const useInsertWaybillMutation = () => {
	return useMutation({
		mutationFn: insertWaybill,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
		},
	});
};

// 刪除託運單
export const useDeleteWaybillMutation = () => {
	return useMutation({
		mutationFn: deleteWaybill,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
		},
	});
};
