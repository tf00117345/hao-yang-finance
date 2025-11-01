import { useQuery } from '@tanstack/react-query';

import { getDriverStats, getDriverStatsById, getStatsSummary, type DriverStatsQueryParams } from '../api/api';

export const useDriverStats = (params: DriverStatsQueryParams) => {
	return useQuery({
		queryKey: ['driverStats', params],
		queryFn: () => getDriverStats(params),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

export const useDriverStatsById = (
	driverId: string,
	params: Omit<DriverStatsQueryParams, 'driverId'>,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ['driverStats', driverId, params],
		queryFn: () => getDriverStatsById(driverId, params),
		enabled: enabled && !!driverId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

export const useStatsSummary = (params: { startDate?: string; endDate?: string }) => {
	return useQuery({
		queryKey: ['statsSummary', params],
		queryFn: () => getStatsSummary(params),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

// 用於圖表的 hook，預設啟用月度分解
export const useDriverStatsWithMonthly = (params: Omit<DriverStatsQueryParams, 'includeMonthlyBreakdown'>) => {
	return useQuery({
		queryKey: ['driverStats', { ...params, includeMonthlyBreakdown: true }],
		queryFn: () => getDriverStats({ ...params, includeMonthlyBreakdown: true }),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};
