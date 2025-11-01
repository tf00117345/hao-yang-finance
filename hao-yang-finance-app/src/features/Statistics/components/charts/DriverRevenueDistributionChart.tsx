import { Card, CardContent, Typography } from '@mui/material';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { DriverStatsDto } from '../../api/api';
import { convertToPieChartData, formatCurrency, getChartColor } from '../../utils/chartUtils';

interface DriverRevenueDistributionChartProps {
	data: DriverStatsDto[];
	title?: string;
}

export function DriverRevenueDistributionChart({ data, title = '司機業績分佈' }: DriverRevenueDistributionChartProps) {
	const chartData = convertToPieChartData(data);

	if (!chartData || chartData.length === 0) {
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
					<PieChart>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							labelLine={false}
							label={(entry) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
							outerRadius={80}
							fill="#8884d8"
							dataKey="value"
						>
							{chartData.map((entry, index) => (
								<Cell key={`cell-${entry.name}-${index}`} fill={getChartColor(index)} />
							))}
						</Pie>
						<Tooltip formatter={(value: number) => formatCurrency(value)} />
						<Legend
							formatter={(value, entry: any) =>
								`${entry.payload.name}: ${formatCurrency(entry.payload.value)}`
							}
						/>
					</PieChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
