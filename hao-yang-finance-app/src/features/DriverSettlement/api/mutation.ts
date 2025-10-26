import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CreateDriverSettlement, UpdateDriverSettlement } from '../types/driver-settlement.types';
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
