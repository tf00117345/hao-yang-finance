import { Card, CardContent, Typography } from '@mui/material';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { MonthlyStatsDto } from '../../api/api';
import { formatCurrency, formatMonth } from '../../utils/chartUtils';

interface MonthlyRevenueChartProps {
	data: MonthlyStatsDto[];
	title?: string;
}

export function MonthlyRevenueChart({ data, title = '每月總收入趨勢' }: MonthlyRevenueChartProps) {
	if (!data || data.length === 0) {
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
					<LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" tickFormatter={formatMonth} />
						<YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
						<Tooltip
							formatter={(value: number) => [formatCurrency(value), '收入']}
							labelFormatter={(label) => `月份: ${formatMonth(label)}`}
						/>
						<Legend />
						<Line
							type="monotone"
							dataKey="revenue"
							name="總收入"
							stroke="#8884d8"
							strokeWidth={2}
							dot={{ r: 4 }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
