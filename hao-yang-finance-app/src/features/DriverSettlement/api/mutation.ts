import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
	CreateDriverSettlement,
	CreateExpenseType,
	UpdateDriverSettlement,
	UpdateExpenseType,
} from '../types/driver-settlement.types';
import { driverSettlementApi } from './api';

export const useCreateDriverSettlement = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateDriverSettlement) => driverSettlementApi.createSettlement(data),
		onSuccess: () => {
			// Invalidate settlements list
			queryClient.invalidateQueries({ queryKey: ['driver-settlements'] });
		},
	});
};

export const useUpdateDriverSettlement = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ settlementId, data }: { settlementId: number; data: UpdateDriverSettlement }) =>
			driverSettlementApi.updateSettlement(settlementId, data),
		onSuccess: (_, variables) => {
			// Invalidate specific settlement and settlements list
			queryClient.invalidateQueries({ queryKey: ['driver-settlement', variables.settlementId] });
			queryClient.invalidateQueries({ queryKey: ['driver-settlements'] });
		},
	});
};

export const useDeleteDriverSettlement = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (settlementId: number) => driverSettlementApi.deleteSettlement(settlementId),
		onSuccess: () => {
			// Invalidate settlements list
			queryClient.invalidateQueries({ queryKey: ['driver-settlements'] });
		},
	});
};

export const useExportDriverSettlementPdf = () => {
	return useMutation({
		mutationFn: (settlementId: number) => driverSettlementApi.exportSettlementPdf(settlementId),
	});
};

export const useCreateExpenseType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateExpenseType) => driverSettlementApi.createExpenseType(data),
		onSuccess: () => {
			// Invalidate expense types list
			queryClient.invalidateQueries({ queryKey: ['expense-types'] });
			queryClient.invalidateQueries({ queryKey: ['default-expenses'] });
		},
	});
};

export const useUpdateExpenseType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateExpenseType }) =>
			driverSettlementApi.updateExpenseType(id, data),
		onSuccess: () => {
			// Invalidate expense types list and default expenses
			queryClient.invalidateQueries({ queryKey: ['expense-types'] });
			queryClient.invalidateQueries({ queryKey: ['default-expenses'] });
		},
	});
};

export const useDeleteExpenseType = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => driverSettlementApi.deleteExpenseType(id),
		onSuccess: () => {
			// Invalidate expense types list and default expenses
			queryClient.invalidateQueries({ queryKey: ['expense-types'] });
			queryClient.invalidateQueries({ queryKey: ['default-expenses'] });
		},
	});
};
