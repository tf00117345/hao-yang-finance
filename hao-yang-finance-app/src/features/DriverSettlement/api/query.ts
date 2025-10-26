import { useQuery } from '@tanstack/react-query';

import { driverSettlementApi } from './api';

export const useDriverSettlements = (targetMonth?: string) => {
	return useQuery({
		queryKey: ['driver-settlements', targetMonth],
		queryFn: () => driverSettlementApi.getSettlements(targetMonth),
	});
};

export const useDriverSettlement = (settlementId: number, enabled = true) => {
	return useQuery({
		queryKey: ['driver-settlement', settlementId],
		queryFn: () => driverSettlementApi.getSettlement(settlementId),
		enabled: enabled && settlementId > 0,
	});
};

export const useDriverSettlementByDriverAndMonth = (driverId: string, targetMonth: string, enabled = true) => {
	return useQuery({
		queryKey: ['driver-settlement-by-driver', driverId, targetMonth],
		queryFn: () => driverSettlementApi.getSettlementByDriverAndMonth(driverId, targetMonth),
		enabled: enabled && !!driverId && !!targetMonth,
	});
};

export const useExpenseTypes = (category?: string) => {
	return useQuery({
		queryKey: ['expense-types', category],
		queryFn: () => driverSettlementApi.getExpenseTypes(category),
	});
};

export const useDefaultExpenses = (category: string, enabled = true) => {
	return useQuery({
		queryKey: ['default-expenses', category],
		queryFn: () => driverSettlementApi.getDefaultExpenses(category),
		enabled: enabled && !!category,
	});
};
