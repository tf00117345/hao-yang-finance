import { useMemo, useState } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
	Box,
	Chip,
	CircularProgress,
	Collapse,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableContainer,
	TableHead,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { endOfMonth, format, startOfMonth } from 'date-fns';

import MonthPicker from '../../../../component/MonthPicker/MonthPicker';
import { DateRange } from '../../../../types/date-range';
import { useInvoiceAuditLogsQuery } from '../../api/query';
import { InvoiceAuditLog } from '../../types/invoice.type';
import { StyledTableCell, StyledTableRow } from '../styles/styles';

const ACTION_CONFIG: Record<
	InvoiceAuditLog['action'],
	{ label: string; color: 'success' | 'info' | 'error' | 'warning' | 'default' }
> = {
	CREATE: { label: '建立', color: 'success' },
	UPDATE: { label: '修改', color: 'info' },
	DELETE: { label: '刪除', color: 'error' },
	VOID: { label: '作廢', color: 'warning' },
	MARK_PAID: { label: '標記收款', color: 'default' },
	RESTORE: { label: '恢復', color: 'default' },
};

// 把 details JSON 轉成易讀的摘要文字
function formatDetailsSummary(log: InvoiceAuditLog): string {
	if (!log.details) return '';
	try {
		const d = JSON.parse(log.details);
		switch (log.action) {
			case 'UPDATE': {
				const parts: string[] = [];
				if (d.oldInvoiceNumber !== d.newInvoiceNumber) {
					parts.push(`號碼 ${d.oldInvoiceNumber} → ${d.newInvoiceNumber}`);
				}
				if (d.oldTotal !== d.newTotal) {
					parts.push(`金額 ${d.oldTotal} → ${d.newTotal}`);
				}
				return parts.length > 0 ? parts.join('，') : '內容更新（號碼與金額未變）';
			}
			case 'DELETE':
				return `刪除時金額 ${d.total ?? d.Total}，發票日期 ${d.date ?? d.Date}`;
			case 'CREATE':
				return `金額 ${d.total ?? d.Total}，含 ${(d.waybillIds ?? []).length} 筆託運單`;
			case 'VOID':
			case 'RESTORE':
				return `原狀態：${d.previousStatus}`;
			case 'MARK_PAID':
				return `付款方式：${d.paymentMethod ?? d.PaymentMethod ?? ''}${
					(d.outstandingAmount ?? d.OutstandingAmount)
						? `，欠款 ${d.outstandingAmount ?? d.OutstandingAmount}`
						: ''
				}`;
			default:
				return '';
		}
	} catch {
		return '';
	}
}

function formatDetailsJson(details?: string): string {
	if (!details) return '';
	try {
		return JSON.stringify(JSON.parse(details), null, 2);
	} catch {
		return details;
	}
}

interface AuditLogRowProps {
	log: InvoiceAuditLog;
}

function AuditLogRow({ log }: AuditLogRowProps) {
	const [expanded, setExpanded] = useState(false);
	const actionConfig = ACTION_CONFIG[log.action] ?? { label: log.action, color: 'default' as const };
	const summary = formatDetailsSummary(log);

	return (
		<>
			<StyledTableRow sx={log.isManuallyModified ? { backgroundColor: '#FFF8E1' } : undefined}>
				<StyledTableCell sx={{ whiteSpace: 'nowrap' }}>
					{format(new Date(log.timestamp), 'yyyy/MM/dd HH:mm:ss')}
				</StyledTableCell>
				<StyledTableCell>
					<Chip label={actionConfig.label} color={actionConfig.color} size="small" />
				</StyledTableCell>
				<StyledTableCell sx={{ fontFamily: 'monospace' }}>{log.invoiceNumber}</StyledTableCell>
				<StyledTableCell sx={{ fontFamily: 'monospace' }}>{log.suggestedInvoiceNumber ?? '—'}</StyledTableCell>
				<StyledTableCell>
					{log.isManuallyModified && (
						<Tooltip title="使用者未採用系統建議號碼，手動輸入了不同的發票號碼">
							<Chip icon={<WarningAmberIcon />} label="手動改號" color="warning" size="small" />
						</Tooltip>
					)}
				</StyledTableCell>
				<StyledTableCell>{log.username ?? '—'}</StyledTableCell>
				<StyledTableCell>{summary}</StyledTableCell>
				<StyledTableCell align="right">
					{log.details && (
						<IconButton size="small" onClick={() => setExpanded((prev) => !prev)}>
							{expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
						</IconButton>
					)}
				</StyledTableCell>
			</StyledTableRow>
			{log.details && (
				<StyledTableRow>
					<StyledTableCell colSpan={8} sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
						<Collapse in={expanded} timeout="auto" unmountOnExit>
							<Box
								component="pre"
								sx={{
									m: 1,
									p: 1.5,
									backgroundColor: '#F5F5F5',
									borderRadius: 1,
									fontSize: 13,
									overflowX: 'auto',
								}}
							>
								{formatDetailsJson(log.details)}
							</Box>
						</Collapse>
					</StyledTableCell>
				</StyledTableRow>
			)}
		</>
	);
}

export default function InvoiceAuditPage() {
	const [dateRange, setDateRange] = useState<DateRange>({
		start: startOfMonth(new Date()),
		end: endOfMonth(new Date()),
	});
	const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');

	const queryParams = useMemo(
		() => ({
			startDate: format(dateRange.start, 'yyyy-MM-dd'),
			endDate: format(dateRange.end, 'yyyy-MM-dd'),
			invoiceNumber: invoiceNumberFilter.trim() || undefined,
		}),
		[dateRange, invoiceNumberFilter],
	);

	const { data: logs = [], isPending } = useInvoiceAuditLogsQuery(queryParams);

	const handleDateChange = (start: Date, end: Date) => {
		setDateRange({ start, end });
	};

	return (
		<Stack direction="column" spacing={1} sx={{ height: '100%', width: '100%', overflow: 'hidden', p: 1 }}>
			<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
				<MonthPicker dateRange={dateRange} onDateChange={handleDateChange} />
				<TextField
					label="發票號碼搜尋"
					size="small"
					value={invoiceNumberFilter}
					onChange={(e) => setInvoiceNumberFilter(e.target.value.toUpperCase())}
					placeholder="例如 CA342155"
				/>
			</Stack>

			{isPending ? (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						flex: 1,
						gap: 2,
					}}
				>
					<CircularProgress size={48} />
					<Typography variant="body2" color="text.secondary">
						載入中...
					</Typography>
				</Box>
			) : (
				<TableContainer component={Paper} sx={{ flex: 1, minHeight: 0 }}>
					<Table stickyHeader size="small">
						<TableHead>
							<StyledTableRow>
								<StyledTableCell>時間</StyledTableCell>
								<StyledTableCell>動作</StyledTableCell>
								<StyledTableCell>發票號碼</StyledTableCell>
								<StyledTableCell>系統建議號碼</StyledTableCell>
								<StyledTableCell>手動改號</StyledTableCell>
								<StyledTableCell>操作者</StyledTableCell>
								<StyledTableCell>詳細內容</StyledTableCell>
								<StyledTableCell align="right">展開</StyledTableCell>
							</StyledTableRow>
						</TableHead>
						<TableBody>
							{logs.length === 0 ? (
								<StyledTableRow>
									<StyledTableCell colSpan={8} align="center">
										<Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
											此期間內沒有發票異動紀錄
										</Typography>
									</StyledTableCell>
								</StyledTableRow>
							) : (
								logs.map((log) => <AuditLogRow key={log.id} log={log} />)
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);
}
