import { useMemo, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Chip,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { format, subMonths } from 'date-fns';

import { getBopomofoInitial, getSortedBopomofoKeys, groupByBopomofo } from '../../../../utils/pinyinHelper';
import { useCompaniesQuery } from '../../../Settings/api/query';
import { Company } from '../../../Settings/types/company';
import { useWaybillsQuery } from '../../api/query';
import { WaybillStatusColors, WaybillStatusLabels } from '../../types/waybill-status.types';
import { Waybill } from '../../types/waybill.types';

// 為公司增加 waybill 列表的介面
interface CompanyWithWaybills extends Company {
	waybills: Waybill[];
}

export default function WaybillByCompanyPage() {
	// 日期範圍狀態 - 預設為前三個月
	const getDefaultDateRange = () => {
		const now = new Date();
		const threeMonthsAgo = subMonths(now, 3);
		return {
			startDate: format(threeMonthsAgo, 'yyyy-MM-dd'),
			endDate: format(now, 'yyyy-MM-dd'),
		};
	};

	const [startDate, setStartDate] = useState<string>(getDefaultDateRange().startDate);
	const [endDate, setEndDate] = useState<string>(getDefaultDateRange().endDate);

	// 快速設定日期範圍
	const handleQuickDateRange = (months: number) => {
		const now = new Date();
		const startDateValue = months === 12 ? subMonths(now, 12) : subMonths(now, months);
		setStartDate(format(startDateValue, 'yyyy-MM-dd'));
		setEndDate(format(now, 'yyyy-MM-dd'));
	};

	// 獲取資料
	const { data: companies = [] } = useCompaniesQuery();
	const { data: waybills = [] } = useWaybillsQuery(
		{
			start: new Date(startDate),
			end: new Date(endDate),
		},
		undefined,
		undefined,
		undefined,
	);

	// 將 waybills 按 companyId 分組
	const waybillsByCompany = useMemo(() => {
		const grouped: Record<string, Waybill[]> = {};

		waybills.forEach((waybill) => {
			if (!grouped[waybill.companyId]) {
				grouped[waybill.companyId] = [];
			}
			grouped[waybill.companyId].push(waybill);
		});

		return grouped;
	}, [waybills]);

	// 將公司與其 waybills 組合
	const companiesWithWaybills = useMemo<CompanyWithWaybills[]>(() => {
		return companies
			.map((company) => ({
				...company,
				waybills: waybillsByCompany[company.id] || [],
			}))
			.filter((company) => company.waybills.length > 0); // 只顯示有 waybill 的公司
	}, [companies, waybillsByCompany]);

	// 按注音分組
	const groupedCompanies = useMemo(() => {
		return groupByBopomofo(companiesWithWaybills, (company) => company.name);
	}, [companiesWithWaybills]);

	// 排序後的注音符號列表
	const sortedBopomofoKeys = useMemo(() => {
		return getSortedBopomofoKeys(groupedCompanies);
	}, [groupedCompanies]);

	return (
		<Box sx={{ p: 2, width: '100%', overflow: 'auto' }}>
			<Typography variant="h4" gutterBottom>
				公司查詢
			</Typography>

			{/* 日期範圍選擇器 */}
			<Paper sx={{ p: 2, mb: 2 }}>
				<Typography variant="h6" gutterBottom>
					日期範圍
				</Typography>
				<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
					<TextField
						label="開始日期"
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						size="small"
						InputLabelProps={{ shrink: true }}
						sx={{ minWidth: 150 }}
					/>
					<TextField
						label="結束日期"
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						size="small"
						InputLabelProps={{ shrink: true }}
						sx={{ minWidth: 150 }}
					/>
					<Button
						variant="outlined"
						size="small"
						startIcon={<RefreshIcon />}
						onClick={() => handleQuickDateRange(1)}
					>
						前一個月
					</Button>
					<Button
						variant="outlined"
						size="small"
						startIcon={<RefreshIcon />}
						onClick={() => handleQuickDateRange(3)}
					>
						前三個月
					</Button>
					<Button
						variant="outlined"
						size="small"
						startIcon={<RefreshIcon />}
						onClick={() => handleQuickDateRange(6)}
					>
						前六個月
					</Button>
					<Button
						variant="outlined"
						size="small"
						startIcon={<RefreshIcon />}
						onClick={() => handleQuickDateRange(12)}
					>
						一整年
					</Button>
				</Stack>
				<Typography variant="body2" color="text.secondary">
					共 {companiesWithWaybills.length} 間公司，{waybills.length} 筆託運單
				</Typography>
			</Paper>

			{/* 雙層 Accordion：注音分組 -> 公司 */}
			{sortedBopomofoKeys.map((bopomofo) => {
				const companiesInGroup = groupedCompanies[bopomofo];
				const totalWaybills = companiesInGroup.reduce((sum, company) => sum + company.waybills.length, 0);

				return (
					<Accordion key={bopomofo} sx={{ mb: 1 }}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography variant="h6" sx={{ minWidth: 40 }}>
									{bopomofo}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									公司數
								</Typography>
								<Typography variant="body2" color="text.secondary">
									({totalWaybills} 筆託運單)
								</Typography>
							</Stack>
						</AccordionSummary>
						<AccordionDetails>
							{companiesInGroup.map((company) => (
								<CompanyAccordion key={company.id} company={company} />
							))}
						</AccordionDetails>
					</Accordion>
				);
			})}

			{companiesWithWaybills.length === 0 && (
				<Paper sx={{ p: 4, textAlign: 'center' }}>
					<Typography variant="body1" color="text.secondary">
						此日期範圍內沒有託運單
					</Typography>
				</Paper>
			)}
		</Box>
	);
}

// 公司 Accordion 組件（第二層）
function CompanyAccordion({ company }: { company: CompanyWithWaybills }) {
	return (
		<Accordion sx={{ mb: 1, boxShadow: 1 }}>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
						{company.name}
					</Typography>
					<Chip label={`${company.waybills.length} 筆`} size="small" color="primary" variant="outlined" />
					<Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
						{getBopomofoInitial(company.name)}
					</Typography>
				</Stack>
			</AccordionSummary>
			<AccordionDetails>
				<WaybillTable waybills={company.waybills} />
			</AccordionDetails>
		</Accordion>
	);
}

// TanStack Table 組件顯示 waybills
function WaybillTable({ waybills }: { waybills: Waybill[] }) {
	// 預設按日期升序排序（由最舊到最新）
	const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: false }]);

	const columnHelper = createColumnHelper<Waybill>();

	const columns = useMemo(
		() => [
			columnHelper.accessor('date', {
				header: '日期',
				cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd'),
				size: 120,
			}),
			columnHelper.accessor('item', {
				header: '項目',
				cell: (info) => info.getValue(),
				size: 100,
			}),
			columnHelper.accessor('tonnage', {
				header: '噸數',
				cell: (info) => `${info.getValue()} 噸`,
				size: 80,
			}),
			columnHelper.accessor('driverName', {
				header: '司機',
				cell: (info) => info.getValue(),
				size: 100,
			}),
			columnHelper.accessor('fee', {
				header: '金額',
				cell: (info) => `$${info.getValue().toLocaleString()}`,
				size: 100,
			}),
			columnHelper.accessor('status', {
				header: '狀態',
				cell: (info) => {
					const status = info.getValue();
					return (
						<Chip label={WaybillStatusLabels[status]} color={WaybillStatusColors[status]} size="small" />
					);
				},
				size: 120,
			}),
			columnHelper.accessor('loadingLocations', {
				header: '裝卸點',
				cell: (info) => {
					const locations = info.getValue();
					return locations.map((loc, idx) => `${loc.from} → ${loc.to}`).join(', ');
				},
				size: 200,
			}),
			columnHelper.accessor('notes', {
				header: '備註',
				cell: (info) => info.getValue() || '-',
				size: 150,
			}),
		],
		[columnHelper],
	);

	const table = useReactTable({
		data: waybills,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<TableContainer component={Paper} sx={{ maxHeight: 600 }}>
			<Table stickyHeader size="small">
				<TableHead>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableCell
									key={header.id}
									sx={{
										fontWeight: 600,
										backgroundColor: 'grey.100',
										cursor: header.column.getCanSort() ? 'pointer' : 'default',
									}}
									onClick={header.column.getToggleSortingHandler()}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										{flexRender(header.column.columnDef.header, header.getContext())}
										{header.column.getIsSorted() && (
											<span>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
										)}
									</Box>
								</TableCell>
							))}
						</TableRow>
					))}
				</TableHead>
				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<TableRow key={row.id} hover>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
