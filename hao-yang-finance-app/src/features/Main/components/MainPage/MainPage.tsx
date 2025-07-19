import { CheckCircleOutline, ErrorOutline, Warning } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';

// 定義發票狀態的介面
interface InvoiceStatus {
	title: string;
	count: number;
	icon: React.ReactNode;
	color: string;
}

export default function MainPage() {
	// 定義三種發票狀態的資料
	const invoiceStatuses: InvoiceStatus[] = [
		{
			title: '未開立發票',
			count: 31,
			icon: <CheckCircleOutline sx={{ fontSize: 40 }} />,
			color: '#4CAF50',
		},
		{
			title: '未確認發票',
			count: 12,
			icon: <Warning sx={{ fontSize: 40 }} />,
			color: '#FFC107',
		},
		{
			title: '款項有誤發票',
			count: 5,
			icon: <ErrorOutline sx={{ fontSize: 40 }} />,
			color: '#F44336',
		},
	];

	return (
		<Box sx={{ p: 3, maxWidth: 'md', mx: 'auto' }}>
			<Stack spacing={2}>
				{invoiceStatuses.map((status) => (
					<Card key={status.title} sx={{ width: '100%' }}>
						<CardContent>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									mb: 2,
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Box sx={{ color: status.color }}>{status.icon}</Box>
									<Box>
										<Typography variant="h6" component="div">
											{status.title}
										</Typography>
										<Typography variant="h4" sx={{ fontWeight: 'bold' }}>
											{status.count}
										</Typography>
									</Box>
								</Box>
							</Box>

							<Box
								sx={{
									display: 'flex',
									justifyContent: 'flex-end',
								}}
							>
								<Button
									variant="contained"
									size="small"
									sx={{
										bgcolor: status.color,
										'&:hover': {
											bgcolor: status.color,
											opacity: 0.9,
										},
									}}
								>
									查看
								</Button>
							</Box>
						</CardContent>
					</Card>
				))}
			</Stack>
		</Box>
	);
}
