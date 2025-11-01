import {
	Chip,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';

import { DriverStatsDto } from '../api/api';
import { formatCurrency } from '../utils/chartUtils';

interface DriverStatsTableProps {
	drivers: DriverStatsDto[];
}

export function DriverStatsTable({ drivers }: DriverStatsTableProps) {
	if (!drivers || drivers.length === 0) {
		return (
			<Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
				暫無資料
			</Typography>
		);
	}

	// 按總收入排序
	const sortedDrivers = [...drivers].sort((a, b) => b.totalRevenue - a.totalRevenue);

	return (
		<TableContainer component={Paper} sx={{ maxHeight: 500 }}>
			<Table size="small" stickyHeader>
				<TableHead>
					<TableRow>
						<TableCell>排名</TableCell>
						<TableCell>司機姓名</TableCell>
						<TableCell align="right">託運單數</TableCell>
						<TableCell align="right">總收入</TableCell>
						<TableCell align="right">平均單價</TableCell>
						<TableCell align="center">狀態分佈</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{sortedDrivers.map((driver, index) => (
						<TableRow key={driver.driverId} hover>
							<TableCell>
								<Chip
									label={index + 1}
									size="small"
									color={index < 3 ? 'primary' : 'default'}
									variant={index < 3 ? 'filled' : 'outlined'}
								/>
							</TableCell>
							<TableCell>
								<Typography variant="body2" fontWeight={index < 3 ? 'bold' : 'normal'}>
									{driver.driverName}
								</Typography>
							</TableCell>
							<TableCell align="right">{driver.totalWaybills}</TableCell>
							<TableCell align="right">
								<Typography
									variant="body2"
									fontWeight={index < 3 ? 'bold' : 'normal'}
									color={index < 3 ? 'primary' : 'inherit'}
								>
									{formatCurrency(driver.totalRevenue)}
								</Typography>
							</TableCell>
							<TableCell align="right">{formatCurrency(driver.averageWaybillFee)}</TableCell>
							<TableCell align="center">
								<Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
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
	);
}
