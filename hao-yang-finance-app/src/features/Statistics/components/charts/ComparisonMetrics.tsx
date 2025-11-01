import { TrendingDown, TrendingUp } from '@mui/icons-material';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

import { calculateGrowthRate, formatCurrency } from '../../utils/chartUtils';

interface ComparisonData {
	current: number;
	previous: number;
	label: string;
}

interface ComparisonMetricsProps {
	revenue: ComparisonData;
	waybills: ComparisonData;
}

export function ComparisonMetrics({ revenue, waybills }: ComparisonMetricsProps) {
	const revenueGrowth = calculateGrowthRate(revenue.current, revenue.previous);
	const waybillsGrowth = calculateGrowthRate(waybills.current, waybills.previous);

	const renderMetricCard = (
		label: string,
		current: number,
		previous: number,
		growthRate: number,
		isCurrency: boolean = false,
	) => {
		const isPositive = growthRate >= 0;
		const formatValue = isCurrency ? formatCurrency : (val: number) => val.toString();

		return (
			<Card>
				<CardContent>
					<Typography variant="subtitle2" color="textSecondary" gutterBottom>
						{label}
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
						<Typography variant="h5">{formatValue(current)}</Typography>
						<Typography variant="body2" color="textSecondary">
							本期
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
						{isPositive ? (
							<TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
						) : (
							<TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
						)}
						<Typography
							variant="body2"
							sx={{
								color: isPositive ? 'success.main' : 'error.main',
								fontWeight: 'bold',
							}}
						>
							{isPositive ? '+' : ''}
							{growthRate.toFixed(1)}%
						</Typography>
						<Typography variant="body2" color="textSecondary">
							vs 上期 {formatValue(previous)}
						</Typography>
					</Box>
				</CardContent>
			</Card>
		);
	};

	return (
		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				{renderMetricCard('總收入', revenue.current, revenue.previous, revenueGrowth, true)}
			</Grid>
			<Grid item xs={12} md={6}>
				{renderMetricCard('託運單數', waybills.current, waybills.previous, waybillsGrowth, false)}
			</Grid>
		</Grid>
	);
}
