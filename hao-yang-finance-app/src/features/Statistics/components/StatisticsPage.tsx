import { useMemo, useState } from 'react';

import {
	ArrowBack,
	ArrowForward,
	Assessment,
	Assignment,
	AttachMoney,
	DateRange,
	Person,
	Refresh,
	TrendingUp,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Grid,
	LinearProgress,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';

import { usePermission } from '../../../contexts/PermissionContext';
import { Permission } from '../../../types/permission.types';
import { useDriverStatsWithMonthly, useStatsSummary } from '../hooks/useDriverStats';
import { aggregateMonthlyStats, formatDateLocal } from '../utils/chartUtils';
import { ComparisonMetrics } from './charts/ComparisonMetrics';
import { DriverMonthlyRevenueChart } from './charts/DriverMonthlyRevenueChart';
import { DriverRevenueDistributionChart } from './charts/DriverRevenueDistributionChart';
import { MonthlyRevenueChart } from './charts/MonthlyRevenueChart';
import { MonthlyWaybillsChart } from './charts/MonthlyWaybillsChart';
import { DriverStatsTable } from './DriverStatsTable';

export function StatisticsPage() {
	const { hasPermission } = usePermission();
	const [tabValue, setTabValue] = useState(0);

	// 日期範圍狀態 - 預設為當月
	const getThisMonth = () => {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		return {
			startDate: formatDateLocal(start),
			endDate: formatDateLocal(end),
		};
	};

	const [startDate, setStartDate] = useState<string>(getThisMonth().startDate);
	const [endDate, setEndDate] = useState<string>(getThisMonth().endDate);

	// 格式化日期參數
	const dateParams = useMemo(() => {
		return {
			startDate: startDate || undefined,
			endDate: endDate || undefined,
		};
	}, [startDate, endDate]);

	// 查詢統計數據（包含月度分解）
	const { data: driverStats, isLoading: isLoadingDrivers } = useDriverStatsWithMonthly(dateParams);
	const { data: summary, isLoading: isLoadingSummary } = useStatsSummary(dateParams);

	// 查詢上一期資料（用於同期比較）
	const previousMonthParams = useMemo(() => {
		if (!startDate) return { startDate: undefined, endDate: undefined };
		const start = new Date(startDate);
		const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
		const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
		return {
			startDate: formatDateLocal(prevStart),
			endDate: formatDateLocal(prevEnd),
		};
	}, [startDate]);

	const { data: previousSummary } = useStatsSummary(previousMonthParams);

	const isLoading = isLoadingDrivers || isLoadingSummary;

	// 月度資料匯總
	const monthlyData = useMemo(() => {
		if (!driverStats?.allDrivers) return [];
		return aggregateMonthlyStats(driverStats.allDrivers);
	}, [driverStats]);

	// 前一月按鈕
	const handlePreviousMonth = () => {
		const start = new Date(startDate);
		const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
		const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);
		setStartDate(formatDateLocal(prevMonthStart));
		setEndDate(formatDateLocal(prevMonthEnd));
	};

	// 後一月按鈕
	const handleNextMonth = () => {
		const start = new Date(startDate);
		const nextMonthStart = new Date(start.getFullYear(), start.getMonth() + 1, 1);
		const nextMonthEnd = new Date(start.getFullYear(), start.getMonth() + 2, 0);
		setStartDate(formatDateLocal(nextMonthStart));
		setEndDate(formatDateLocal(nextMonthEnd));
	};

	// 重置日期範圍
	const handleResetDateRange = (months: number) => {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		setStartDate(formatDateLocal(start));
		setEndDate(formatDateLocal(end));
	};

	// 格式化金額
	const formatCurrency = (amount: number) => {
		return `$${amount.toLocaleString()}`;
	};

	// 計算百分比
	const calculatePercentage = (value: number, total: number) => {
		return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
	};

	// 權限檢查
	if (!hasPermission(Permission.StatisticsRead)) {
		return (
			<Alert sx={{ width: '100%' }} severity="error">
				您沒有權限訪問業績統計功能。請聯繫系統管理員。
			</Alert>
		);
	}

	return (
		<Box sx={{ p: 1, overflow: 'auto', width: '100%' }}>
			<Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<TrendingUp />
				司機業績統計
			</Typography>

			{/* 日期範圍選擇器 */}
			<Card sx={{ mb: 1 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<DateRange />
						日期範圍
					</Typography>
					<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
						<Button variant="outlined" onClick={handlePreviousMonth} startIcon={<ArrowBack />} size="small">
							前一月
						</Button>
						<TextField
							label="開始日期"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							size="small"
							sx={{ minWidth: 150 }}
							InputLabelProps={{ shrink: true }}
						/>
						<TextField
							label="結束日期"
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							size="small"
							sx={{ minWidth: 150 }}
							InputLabelProps={{ shrink: true }}
						/>
						<Button variant="outlined" onClick={handleNextMonth} endIcon={<ArrowForward />} size="small">
							後一月
						</Button>
						<Button
							variant="outlined"
							onClick={() => handleResetDateRange(1)}
							startIcon={<Refresh />}
							size="small"
						>
							本月
						</Button>
						<Button
							variant="outlined"
							onClick={() => handleResetDateRange(3)}
							startIcon={<Refresh />}
							size="small"
						>
							近3月
						</Button>
						<Button
							variant="outlined"
							onClick={() => handleResetDateRange(6)}
							startIcon={<Refresh />}
							size="small"
						>
							近6月
						</Button>
						<Button
							variant="outlined"
							onClick={() => handleResetDateRange(12)}
							startIcon={<Refresh />}
							size="small"
						>
							近1年
						</Button>
					</Stack>
				</CardContent>
			</Card>

			{isLoading && <LinearProgress sx={{ mb: 1 }} />}

			{/* 分頁籤 */}
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
				<Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} aria-label="統計分頁">
					<Tab label="概覽" icon={<Assessment />} iconPosition="start" />
					<Tab label="司機分析" icon={<Person />} iconPosition="start" />
					<Tab label="趨勢分析" icon={<TrendingUp />} iconPosition="start" />
				</Tabs>
			</Box>

			{/* 概覽頁籤 */}
			{tabValue === 0 && (
				<Box>
					{/* 總體統計卡片 */}
					{summary && (
						<Grid container spacing={2} sx={{ mb: 2 }}>
							<Grid item xs={12} sm={6} md={3}>
								<Card>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<Box>
												<Typography color="textSecondary" gutterBottom variant="body2">
													總託運單數
												</Typography>
												<Typography variant="h5">
													{summary.totalWaybills.toLocaleString()}
												</Typography>
											</Box>
											<Assignment sx={{ fontSize: 40, color: 'primary.main' }} />
										</Box>
									</CardContent>
								</Card>
							</Grid>

							<Grid item xs={12} sm={6} md={3}>
								<Card>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<Box>
												<Typography color="textSecondary" gutterBottom variant="body2">
													總收入
												</Typography>
												<Typography variant="h5">
													{formatCurrency(summary.totalRevenue)}
												</Typography>
											</Box>
											<AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
										</Box>
									</CardContent>
								</Card>
							</Grid>

							<Grid item xs={12} sm={6} md={3}>
								<Card>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<Box>
												<Typography color="textSecondary" gutterBottom variant="body2">
													活躍司機數
												</Typography>
												<Typography variant="h5">{summary.activeDrivers}</Typography>
											</Box>
											<Person sx={{ fontSize: 40, color: 'info.main' }} />
										</Box>
									</CardContent>
								</Card>
							</Grid>

							<Grid item xs={12} sm={6} md={3}>
								<Card>
									<CardContent>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<Box>
												<Typography color="textSecondary" gutterBottom variant="body2">
													平均單價
												</Typography>
												<Typography variant="h5">
													{formatCurrency(summary.averageWaybillFee)}
												</Typography>
											</Box>
											<TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
										</Box>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					)}

					{/* 同期比較 */}
					{summary && previousSummary && (
						<Box sx={{ mb: 2 }}>
							<Typography variant="h6" gutterBottom>
								同期比較
							</Typography>
							<ComparisonMetrics
								revenue={{
									current: summary.totalRevenue,
									previous: previousSummary.totalRevenue,
									label: '總收入',
								}}
								waybills={{
									current: summary.totalWaybills,
									previous: previousSummary.totalWaybills,
									label: '託運單數',
								}}
							/>
						</Box>
					)}

					{/* 狀態分佈統計 */}
					{summary && (
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									託運單狀態分佈
								</Typography>
								<Grid container spacing={2}>
									<Grid item xs={12} md={4}>
										<Box
											sx={{
												p: 2,
												border: '1px solid',
												borderColor: 'warning.light',
												borderRadius: 1,
											}}
										>
											<Typography variant="subtitle2" color="warning.main">
												待處理
											</Typography>
											<Typography variant="h6">
												{summary.statusBreakdown.pending.count} 筆
											</Typography>
											<Typography variant="body2" color="textSecondary">
												{formatCurrency(summary.statusBreakdown.pending.revenue)}
											</Typography>
											<Typography variant="caption">
												(
												{calculatePercentage(
													summary.statusBreakdown.pending.count,
													summary.totalWaybills,
												)}
												%)
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} md={4}>
										<Box
											sx={{
												p: 2,
												border: '1px solid',
												borderColor: 'success.light',
												borderRadius: 1,
											}}
										>
											<Typography variant="subtitle2" color="success.main">
												已開發票
											</Typography>
											<Typography variant="h6">
												{summary.statusBreakdown.invoiced.count} 筆
											</Typography>
											<Typography variant="body2" color="textSecondary">
												{formatCurrency(summary.statusBreakdown.invoiced.revenue)}
											</Typography>
											<Typography variant="caption">
												(
												{calculatePercentage(
													summary.statusBreakdown.invoiced.count,
													summary.totalWaybills,
												)}
												%)
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} md={4}>
										<Box
											sx={{
												p: 2,
												border: '1px solid',
												borderColor: 'info.light',
												borderRadius: 1,
											}}
										>
											<Typography variant="subtitle2" color="info.main">
												無須開發票
											</Typography>
											<Typography variant="h6">
												{summary.statusBreakdown.noInvoiceNeeded.count} 筆
											</Typography>
											<Typography variant="body2" color="textSecondary">
												{formatCurrency(summary.statusBreakdown.noInvoiceNeeded.revenue)}
											</Typography>
											<Typography variant="caption">
												(
												{calculatePercentage(
													summary.statusBreakdown.noInvoiceNeeded.count,
													summary.totalWaybills,
												)}
												%)
											</Typography>
										</Box>
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					)}
				</Box>
			)}

			{/* 司機分析頁籤 */}
			{tabValue === 1 && driverStats && (
				<Box>
					<Grid container spacing={2}>
						<Grid item xs={12} lg={6}>
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										司機業績表 ({driverStats.allDrivers.length} 位)
									</Typography>
									<DriverStatsTable drivers={driverStats.allDrivers} />
								</CardContent>
							</Card>
						</Grid>
						<Grid item xs={12} lg={6}>
							<DriverRevenueDistributionChart data={driverStats.allDrivers} />
						</Grid>
					</Grid>
				</Box>
			)}

			{/* 趨勢分析頁籤 */}
			{tabValue === 2 && (
				<Box>
					<Grid container spacing={2}>
						<Grid item xs={12} lg={6}>
							<MonthlyRevenueChart data={monthlyData} />
						</Grid>
						<Grid item xs={12} lg={6}>
							<MonthlyWaybillsChart data={monthlyData} />
						</Grid>
						<Grid item xs={12}>
							{driverStats && <DriverMonthlyRevenueChart data={driverStats.allDrivers} />}
						</Grid>
					</Grid>
				</Box>
			)}
		</Box>
	);
}
