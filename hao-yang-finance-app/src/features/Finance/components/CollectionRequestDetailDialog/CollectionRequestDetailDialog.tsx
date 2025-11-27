import { Close as CloseIcon } from '@mui/icons-material';
import {
	Box,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
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
import { format } from 'date-fns';

import { useCollectionRequestDetail } from '../../../../hooks/useCollectionRequest';
import { CollectionRequestStatusColors, CollectionRequestStatusLabels } from '../../types/collection-request.types';

interface CollectionRequestDetailDialogProps {
	open: boolean;
	collectionRequestId: string;
	onClose: () => void;
}

export function CollectionRequestDetailDialog({
	open,
	collectionRequestId,
	onClose,
}: CollectionRequestDetailDialogProps) {
	const { data: collectionRequest, isLoading } = useCollectionRequestDetail(collectionRequestId, open);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('zh-TW', {
			style: 'currency',
			currency: 'TWD',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">請款單詳情</Typography>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				{isLoading && (
					<Box sx={{ textAlign: 'center', py: 3 }}>
						<Typography>載入中...</Typography>
					</Box>
				)}

				{collectionRequest && (
					<Stack spacing={3}>
						{/* 基本資訊 */}
						<Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
							<Grid container spacing={2}>
								<Grid item xs={6}>
									<Typography variant="caption" color="text.secondary">
										請款單號
									</Typography>
									<Typography variant="body1" fontWeight="bold">
										{collectionRequest.requestNumber}
									</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="caption" color="text.secondary">
										請款日期
									</Typography>
									<Typography variant="body1">
										{format(new Date(collectionRequest.requestDate), 'yyyy/MM/dd')}
									</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="caption" color="text.secondary">
										公司名稱
									</Typography>
									<Typography variant="body1">{collectionRequest.companyName}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="caption" color="text.secondary">
										狀態
									</Typography>
									<Box>
										<Chip
											label={CollectionRequestStatusLabels[collectionRequest.status]}
											color={CollectionRequestStatusColors[collectionRequest.status]}
											size="small"
										/>
									</Box>
								</Grid>
							</Grid>
						</Paper>

						{/* 金額資訊 */}
						<Box>
							<Typography variant="subtitle2" gutterBottom>
								金額明細
							</Typography>
							<Divider sx={{ mb: 2 }} />
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between">
									<Typography>小計</Typography>
									<Typography>{formatCurrency(collectionRequest.subtotal)}</Typography>
								</Stack>
								<Stack direction="row" justifyContent="space-between">
									<Typography>稅額 ({(collectionRequest.taxRate * 100).toFixed(0)}%)</Typography>
									<Typography>{formatCurrency(collectionRequest.taxAmount)}</Typography>
								</Stack>
								<Divider />
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="h6">總計</Typography>
									<Typography variant="h6" color="primary" fontWeight="bold">
										{formatCurrency(collectionRequest.totalAmount)}
									</Typography>
								</Stack>
							</Stack>
						</Box>

						{/* 收款資訊 */}
						{collectionRequest.paymentReceivedAt && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									收款資訊
								</Typography>
								<Divider sx={{ mb: 2 }} />
								<Grid container spacing={2}>
									<Grid item xs={6}>
										<Typography variant="caption" color="text.secondary">
											收款日期
										</Typography>
										<Typography variant="body2">
											{format(new Date(collectionRequest.paymentReceivedAt), 'yyyy/MM/dd')}
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="caption" color="text.secondary">
											收款方式
										</Typography>
										<Typography variant="body2">
											{collectionRequest.paymentMethod || '-'}
										</Typography>
									</Grid>
									{collectionRequest.paymentNotes && (
										<Grid item xs={12}>
											<Typography variant="caption" color="text.secondary">
												收款備註
											</Typography>
											<Typography variant="body2">{collectionRequest.paymentNotes}</Typography>
										</Grid>
									)}
								</Grid>
							</Box>
						)}

						{/* 託運單列表 */}
						<Box>
							<Typography variant="subtitle2" gutterBottom>
								託運單明細 ({collectionRequest.waybillCount} 筆)
							</Typography>
							<Divider sx={{ mb: 2 }} />
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>日期</TableCell>
											<TableCell>品項</TableCell>
											<TableCell>所屬公司</TableCell>
											<TableCell>司機</TableCell>
											<TableCell>車號</TableCell>
											<TableCell align="right">運費</TableCell>
											<TableCell align="right">稅額</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{collectionRequest.waybills.map((waybill) => {
											// 判斷是否為非請款對象公司的託運單
											const isDifferentCompany =
												waybill.companyId && waybill.companyId !== collectionRequest.companyId;

											return (
												<TableRow
													key={waybill.id}
													sx={{
														bgcolor: isDifferentCompany ? 'warning.50' : undefined,
													}}
												>
													<TableCell>
														{format(new Date(waybill.date), 'yyyy/MM/dd')}
													</TableCell>
													<TableCell>{waybill.item}</TableCell>
													<TableCell>
														{waybill.companyName || '-'}
														{isDifferentCompany && (
															<Typography
																variant="caption"
																color="warning.main"
																sx={{ ml: 1 }}
															>
																(非請款對象)
															</Typography>
														)}
													</TableCell>
													<TableCell>{waybill.driverName}</TableCell>
													<TableCell>{waybill.plateNumber}</TableCell>
													<TableCell align="right">{formatCurrency(waybill.fee)}</TableCell>
													<TableCell align="right">
														{waybill.taxAmount ? formatCurrency(waybill.taxAmount) : '-'}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>

						{/* 備註 */}
						{collectionRequest.notes && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									備註
								</Typography>
								<Divider sx={{ mb: 2 }} />
								<Typography variant="body2" color="text.secondary">
									{collectionRequest.notes}
								</Typography>
							</Box>
						)}
					</Stack>
				)}
			</DialogContent>
		</Dialog>
	);
}
