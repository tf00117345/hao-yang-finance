import { axiosInstance } from '../../../utils/axios-instance';

export interface DriverStatsDto {
	driverId: string;
	driverName: string;
	totalWaybills: number;
	// invoicedWaybills: number;
	// noInvoiceNeededWaybills: number;
	totalRevenue: number;
	// invoicedRevenue: number;
	// noInvoiceNeededRevenue: number;
	averageWaybillFee: number;
	firstWaybillDate: string;
	lastWaybillDate: string;
	monthlyStats: MonthlyStatsDto[];
}

export interface MonthlyStatsDto {
	month: string; // YYYY-MM format
	waybillCount: number;
	revenue: number;
	averageFee: number;
}

export interface DriverStatsSummaryDto {
	totalDrivers: number;
	activeDrivers: number;
	totalRevenue: number;
	averageRevenuePerDriver: number;
	totalWaybills: number;
	averageWaybillsPerDriver: number;
	topDrivers: DriverStatsDto[];
	allDrivers: DriverStatsDto[];
}

export interface DriverStatsQueryParams {
	startDate?: string;
	endDate?: string;
	driverId?: string;
	includeMonthlyBreakdown?: boolean;
	topDriversCount?: number;
}

export interface StatsSummaryDto {
	totalWaybills: number;
	totalRevenue: number;
	activeDrivers: number;
	averageRevenuePerDriver: number;
	averageWaybillFee: number;
	statusBreakdown: {
		pending: { count: number; revenue: number };
		invoiced: { count: number; revenue: number };
		noInvoiceNeeded: { count: number; revenue: number };
	};
}

// 獲取司機業績統計總覽
export const getDriverStats = async (params: DriverStatsQueryParams): Promise<DriverStatsSummaryDto> => {
	const response = await axiosInstance.get('/DriverStats', { params });
	return response.data;
};

// 獲取特定司機的詳細統計
export const getDriverStatsById = async (
	driverId: string,
	params: Omit<DriverStatsQueryParams, 'driverId'>,
): Promise<DriverStatsDto> => {
	const response = await axiosInstance.get(`/DriverStats/${driverId}`, { params });
	return response.data;
};

// 獲取統計摘要
export const getStatsSummary = async (params: { startDate?: string; endDate?: string }): Promise<StatsSummaryDto> => {
	const response = await axiosInstance.get('/DriverStats/summary', { params });
	return response.data;
};
