import { Card, CardContent, Typography } from '@mui/material';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { MonthlyStatsDto } from '../../api/api';
import { formatCurrency, formatMonth } from '../../utils/chartUtils';

interface MonthlyWaybillsChartProps {
	data: MonthlyStatsDto[];
	title?: string;
}

export function MonthlyWaybillsChart({ data, title = '每月託運單數量與收入趨勢' }: MonthlyWaybillsChartProps) {
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
					<ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" tickFormatter={formatMonth} />
						<YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `${value} 筆`} />
						<YAxis
							yAxisId="right"
							orientation="right"
							tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
						/>
						<Tooltip
							formatter={(value: number, name: string) => {
								if (name === '託運單數') return [value, name];
								return [formatCurrency(value), name];
							}}
							labelFormatter={(label) => `月份: ${formatMonth(label)}`}
						/>
						<Legend />
						<Bar yAxisId="left" dataKey="waybillCount" name="託運單數" fill="#82ca9d" />
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="revenue"
							name="總收入"
							stroke="#8884d8"
							strokeWidth={2}
							dot={{ r: 4 }}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
