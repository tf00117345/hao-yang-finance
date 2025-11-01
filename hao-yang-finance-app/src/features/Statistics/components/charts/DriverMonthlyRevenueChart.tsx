import { Card, CardContent, Typography } from '@mui/material';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { DriverStatsDto } from '../../api/api';
import { convertToMultiLineData, formatCurrency, formatMonth, getChartColor } from '../../utils/chartUtils';

interface DriverMonthlyRevenueChartProps {
	data: DriverStatsDto[];
	title?: string;
}

export function DriverMonthlyRevenueChart({ data, title = '各司機月度收入對比' }: DriverMonthlyRevenueChartProps) {
	const chartData = convertToMultiLineData(data);

	if (!chartData || chartData.length === 0 || !data || data.length === 0) {
		return (
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{title}
					</Typography>
					<Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
						暫無資料
					</Typography>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					{title}
				</Typography>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" tickFormatter={formatMonth} />
						<YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
						<Tooltip
							formatter={(value: number) => formatCurrency(value)}
							labelFormatter={(label) => `月份: ${formatMonth(label)}`}
						/>
						<Legend />
						{data.map((driver, index) => (
							<Line
								key={driver.driverId}
								type="monotone"
								dataKey={driver.driverName}
								name={driver.driverName}
								stroke={getChartColor(index)}
								strokeWidth={2}
								dot={{ r: 3 }}
								activeDot={{ r: 5 }}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
