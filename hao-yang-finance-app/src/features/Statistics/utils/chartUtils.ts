import { DriverStatsDto, MonthlyStatsDto } from '../api/api';

/**
 * 匯總所有司機的月度資料
 */
export const aggregateMonthlyStats = (drivers: DriverStatsDto[]): MonthlyStatsDto[] => {
	const monthlyMap = new Map<string, { waybillCount: number; revenue: number; count: number }>();

	drivers.forEach((driver) => {
		driver.monthlyStats?.forEach((stat) => {
			const existing = monthlyMap.get(stat.month) || { waybillCount: 0, revenue: 0, count: 0 };
			monthlyMap.set(stat.month, {
				waybillCount: existing.waybillCount + stat.waybillCount,
				revenue: existing.revenue + stat.revenue,
				count: existing.count + 1,
			});
		});
	});

	return Array.from(monthlyMap.entries())
		.map(([month, data]) => ({
			month,
			waybillCount: data.waybillCount,
			revenue: data.revenue,
			averageFee: data.waybillCount > 0 ? data.revenue / data.waybillCount : 0,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * 轉換司機業績為圓餅圖資料
 */
export interface PieChartData {
	name: string;
	value: number;
	percentage: number;
}

export const convertToPieChartData = (drivers: DriverStatsDto[]): PieChartData[] => {
	const totalRevenue = drivers.reduce((sum, driver) => sum + driver.totalRevenue, 0);

	return drivers
		.filter((driver) => driver.totalRevenue > 0)
		.map((driver) => ({
			name: driver.driverName,
			value: driver.totalRevenue,
			percentage: totalRevenue > 0 ? (driver.totalRevenue / totalRevenue) * 100 : 0,
		}))
		.sort((a, b) => b.value - a.value);
};

/**
 * 轉換為多線圖資料格式
 */
export interface MultiLineChartData {
	month: string;
	[key: string]: string | number; // 動態司機名稱作為 key
}

export const convertToMultiLineData = (drivers: DriverStatsDto[]): MultiLineChartData[] => {
	const monthSet = new Set<string>();
	drivers.forEach((driver) => {
		driver.monthlyStats?.forEach((stat) => monthSet.add(stat.month));
	});

	const sortedMonths = Array.from(monthSet).sort();

	return sortedMonths.map((month) => {
		const dataPoint: MultiLineChartData = { month };
		drivers.forEach((driver) => {
			const stat = driver.monthlyStats?.find((s) => s.month === month);
			dataPoint[driver.driverName] = stat?.revenue || 0;
		});
		return dataPoint;
	});
};

/**
 * 格式化貨幣
 */
export const formatCurrency = (value: number): string => {
	return `$${value.toLocaleString()}`;
};

/**
 * 格式化月份顯示
 */
export const formatMonth = (month: string): string => {
	const [year, monthNum] = month.split('-');
	return `${year}/${monthNum}`;
};

/**
 * 計算成長率
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
	if (previous === 0) return current > 0 ? 100 : 0;
	return ((current - previous) / previous) * 100;
};

/**
 * 取得上個月的日期範圍
 */
export const getPreviousMonthRange = (startDate: string, endDate: string): { startDate: string; endDate: string } => {
	const start = new Date(startDate);
	const previousMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
	const previousMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);

	return {
		startDate: formatDateLocal(previousMonthStart),
		endDate: formatDateLocal(previousMonthEnd),
	};
};

/**
 * 以本地時間格式化日期
 */
export const formatDateLocal = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

/**
 * 圖表顏色配置
 */
export const CHART_COLORS = [
	'#8884d8', // 藍色
	'#82ca9d', // 綠色
	'#ffc658', // 橙色
	'#ff7c7c', // 紅色
	'#a28fd0', // 紫色
	'#83d0c9', // 青色
	'#f4a582', // 珊瑚色
	'#92c5de', // 天藍色
];

/**
 * 取得圖表顏色
 */
export const getChartColor = (index: number): string => {
	return CHART_COLORS[index % CHART_COLORS.length];
};
