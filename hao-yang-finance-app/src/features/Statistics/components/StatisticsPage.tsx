import React, { useState, useMemo } from 'react';
import {
	Box,
	Paper,
	Typography,
	Grid,
	Card,
	CardContent,
	TextField,
	Button,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	LinearProgress,
	Divider,
} from '@mui/material';
import { TrendingUp, Person, Assignment, AttachMoney, DateRange, Refresh } from '@mui/icons-material';
// import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useDriverStats, useStatsSummary } from '../hooks/useDriverStats';
import type { DriverStatsDto } from '../api/api';

export function StatisticsPage() {
	// 日期範圍狀態 - 預設為過去3個月
	const getThreeMonthsAgo = () => {
		const date = new Date();
		date.setMonth(date.getMonth() - 3);
		return date.toISOString().split('T')[0];
	};

	const getCurrentDate = () => {
		return new Date().toISOString().split('T')[0];
	};

	const [startDate, setStartDate] = useState<string>(getThreeMonthsAgo());
	const [endDate, setEndDate] = useState<string>(getCurrentDate());

	// 格式化日期參數
	const dateParams = useMemo(() => {
		return {
			startDate: startDate || undefined,
			endDate: endDate || undefined,
		};
	}, [startDate, endDate]);

	// 查詢統計數據
	const { data: driverStats, isLoading: isLoadingDrivers } = useDriverStats({
		...dateParams,
		includeMonthlyBreakdown: false,
		topDriversCount: 10,
	});

	const { data: summary, isLoading: isLoadingSummary } = useStatsSummary(dateParams);

	const isLoading = isLoadingDrivers || isLoadingSummary;

	// 重置日期範圍
	const handleResetDateRange = (months: number) => {
		const date = new Date();
		date.setMonth(date.getMonth() - months);
		setStartDate(date.toISOString().split('T')[0]);
		setEndDate(getCurrentDate());
	};

	// 格式化金額
	const formatCurrency = (amount: number) => {
		return `$${amount.toLocaleString()}`;
	};

	// 計算百分比
	const calculatePercentage = (value: number, total: number) => {
		return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
	};

	return (
		<Box sx={{ p: 3, overflow: 'auto', width: '100%' }}>
			<Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<TrendingUp />
				司機業績統計
			</Typography>

			{/* 日期範圍選擇器 */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<DateRange />
						日期範圍
					</Typography>
					<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
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
						<Button variant="outlined" onClick={() => handleResetDateRange(1)} startIcon={<Refresh />}>
							重置 (近1個月)
						</Button>
						<Button variant="outlined" onClick={() => handleResetDateRange(3)} startIcon={<Refresh />}>
							重置 (近3個月)
						</Button>
						<Button variant="outlined" onClick={() => handleResetDateRange(6)} startIcon={<Refresh />}>
							重置 (近6個月)
						</Button>
						<Button variant="outlined" onClick={() => handleResetDateRange(12)} startIcon={<Refresh />}>
							重置 (近1年)
						</Button>
					</Stack>
				</CardContent>
			</Card>

			{isLoading && <LinearProgress sx={{ mb: 2 }} />}

			{/* 總體統計卡片 */}
			{summary && (
				<Grid container spacing={3} sx={{ mb: 3 }}>
					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<Box>
										<Typography color="textSecondary" gutterBottom variant="body2">
											總託運單數
										</Typography>
										<Typography variant="h5">{summary.totalWaybills.toLocaleString()}</Typography>
									</Box>
									<Assignment sx={{ fontSize: 40, color: 'primary.main' }} />
								</Box>
							</CardContent>
						</Card>
					</Grid>

					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<Box>
										<Typography color="textSecondary" gutterBottom variant="body2">
											總收入
										</Typography>
										<Typography variant="h5">{formatCurrency(summary.totalRevenue)}</Typography>
									</Box>
									<AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
								</Box>
							</CardContent>
						</Card>
					</Grid>

					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

			{/* 狀態分佈統計 */}
			{summary && (
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							託運單狀態分佈
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}>
								<Box sx={{ p: 2, border: '1px solid', borderColor: 'warning.light', borderRadius: 1 }}>
									<Typography variant="subtitle2" color="warning.main">
										待處理
									</Typography>
									<Typography variant="h6">{summary.statusBreakdown.pending.count} 筆</Typography>
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
								<Box sx={{ p: 2, border: '1px solid', borderColor: 'success.light', borderRadius: 1 }}>
									<Typography variant="subtitle2" color="success.main">
										已開發票
									</Typography>
									<Typography variant="h6">{summary.statusBreakdown.invoiced.count} 筆</Typography>
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
								<Box sx={{ p: 2, border: '1px solid', borderColor: 'info.light', borderRadius: 1 }}>
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

			{/* 司機業績排行榜 */}
			{driverStats && (
				<Grid container spacing={3}>
					{/* 前10名司機 */}
					<Grid item xs={12} lg={6}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									業績前10名司機
								</Typography>
								<TableContainer>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell>排名</TableCell>
												<TableCell>司機姓名</TableCell>
												<TableCell align="right">託運單數</TableCell>
												<TableCell align="right">總收入</TableCell>
												<TableCell align="right">平均單價</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{driverStats.topDrivers.map((driver, index) => (
												<TableRow key={driver.driverId}>
													<TableCell>
														<Chip
															label={index + 1}
															size="small"
															color={index < 3 ? 'primary' : 'default'}
															variant={index < 3 ? 'filled' : 'outlined'}
														/>
													</TableCell>
													<TableCell>{driver.driverName}</TableCell>
													<TableCell align="right">{driver.totalWaybills}</TableCell>
													<TableCell align="right">
														{formatCurrency(driver.totalRevenue)}
													</TableCell>
													<TableCell align="right">
														{formatCurrency(driver.averageWaybillFee)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</CardContent>
						</Card>
					</Grid>

					{/* 所有司機統計 */}
					<Grid item xs={12} lg={6}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									所有司機業績 ({driverStats.allDrivers.length} 位)
								</Typography>
								<TableContainer sx={{ maxHeight: 400 }}>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow>
												<TableCell>司機姓名</TableCell>
												<TableCell align="right">託運單</TableCell>
												<TableCell align="right">收入</TableCell>
												<TableCell align="center">狀態分佈</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{driverStats.allDrivers.map((driver) => (
												<TableRow key={driver.driverId}>
													<TableCell>{driver.driverName}</TableCell>
													<TableCell align="right">{driver.totalWaybills}</TableCell>
													<TableCell align="right">
														{formatCurrency(driver.totalRevenue)}
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={0.5} justifyContent="center">
															{driver.pendingWaybills > 0 && (
																<Chip
																	label={driver.pendingWaybills}
																	size="small"
																	color="warning"
																	variant="outlined"
																/>
															)}
															{driver.invoicedWaybills > 0 && (
																<Chip
																	label={driver.invoicedWaybills}
																	size="small"
																	color="success"
																	variant="outlined"
																/>
															)}
															{driver.noInvoiceNeededWaybills > 0 && (
																<Chip
																	label={driver.noInvoiceNeededWaybills}
																	size="small"
																	color="info"
																	variant="outlined"
																/>
															)}
														</Stack>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}
		</Box>
	);
}
