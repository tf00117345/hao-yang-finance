import { useMemo } from 'react';

import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { DateRange } from '../../types/date-range';
import { endOfDay, startOfDay } from '../../utils/date-utils';

// 將類型定義移到頂部
interface MonthPickerProps {
	dateRange: DateRange;
	onDateChange: (start: Date, end: Date) => void;
}

interface MonthOption {
	label: string;
	start: (year: number) => Date;
	end: (year: number) => Date;
}

// 將常數移到組件外部
const YEAR_RANGE = 11;
const MONTHS_IN_YEAR = 12;

// 生成年份選項
const generateYearOptions = (currentYear: number): number[] =>
	Array.from({ length: YEAR_RANGE }, (_, i) => currentYear - i);

// 生成月份選項
const generateMonths = (): MonthOption[] => [
	{
		label: '全年',
		start: (year: number) => new Date(year, 0, 1),
		end: (year: number) => new Date(year, 11, 31),
	},
	...Array.from({ length: MONTHS_IN_YEAR }).map((_, i) => ({
		label: `${i + 1}月`,
		start: (year: number) => new Date(year, i, 1),
		end: (year: number) => new Date(year, i + 1, 0),
	})),
];

// 自定義 ToggleButton 樣式
const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
	'&.MuiToggleButton-root': {
		border: `1px solid ${theme.palette.primary.main}`,
		color: theme.palette.primary.main,
		lineHeight: 1,
		'&:hover': {
			backgroundColor: theme.palette.primary.light,
			color: theme.palette.primary.contrastText,
		},
	},
	'&.Mui-selected': {
		backgroundColor: theme.palette.primary.main,
		color: theme.palette.primary.contrastText,
		'&:hover': {
			backgroundColor: theme.palette.primary.dark,
		},
	},
}));

// 自定義 DatePicker 樣式
const StyledDatePicker = styled(DatePicker)(() => ({}));

function MonthPicker({ dateRange, onDateChange }: MonthPickerProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // <1200px (平板+手機)
	const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // ≥1200px (電腦版)

	// 使用 useMemo 緩存計算結果
	const months = useMemo(() => generateMonths(), []);
	const currentYear = dateRange.start.getFullYear();
	const yearOptions = useMemo(() => generateYearOptions(new Date().getFullYear()), []);

	// 計算當前選中的月份
	const getCurrentMonthLabel = (date: Date): string => {
		if (
			date.getMonth() === 0 &&
			date.getDate() === 1 &&
			dateRange.end.getMonth() === 11 &&
			dateRange.end.getDate() === 31
		) {
			return '全年';
		}
		return `${date.getMonth() + 1}月`;
	};

	// 處理年份變更 (ToggleButton)
	const handleYearChange = (_: React.MouseEvent<HTMLElement>, newYear: number | null) => {
		if (!newYear) return;

		const monthData = months.find((m) => m.label === getCurrentMonthLabel(dateRange.start));
		if (monthData) {
			onDateChange(startOfDay(monthData.start(newYear)), endOfDay(monthData.end(newYear)));
		}
	};

	// 處理年份變更 (Select - 用於手機版)
	const handleYearSelectChange = (event: any) => {
		const newYear = event.target.value;
		const monthData = months.find((m) => m.label === getCurrentMonthLabel(dateRange.start));
		if (monthData) {
			onDateChange(startOfDay(monthData.start(newYear)), endOfDay(monthData.end(newYear)));
		}
	};

	// 處理月份變更 (ToggleButton)
	const handleMonthChange = (_: React.MouseEvent<HTMLElement>, newMonth: string | null) => {
		if (!newMonth) return;
		const monthData = months.find((m) => m.label === newMonth);

		if (monthData) {
			onDateChange(startOfDay(monthData.start(currentYear)), endOfDay(monthData.end(currentYear)));
		}
	};

	// 處理月份變更 (Select - 用於平板/手機版)
	const handleMonthSelectChange = (event: any) => {
		const newMonth = event.target.value;
		const monthData = months.find((m) => m.label === newMonth);

		if (monthData) {
			onDateChange(startOfDay(monthData.start(currentYear)), endOfDay(monthData.end(currentYear)));
		}
	};

	// 處理日期選擇器變更
	const handleStartDateChange = (newDate: Date | null) => {
		if (!newDate) return;

		const endDate = newDate > dateRange.end ? newDate : dateRange.end;
		onDateChange(startOfDay(newDate), endOfDay(endDate));
	};

	const handleEndDateChange = (newDate: Date | null) => {
		if (!newDate) return;

		const startDate = newDate < dateRange.start ? newDate : dateRange.start;
		onDateChange(startOfDay(startDate), endOfDay(newDate));
	};

	return (
		<Stack spacing={isMobile ? 2 : 1}>
			{/* 年份和月份選擇器 - 響應式 */}
			{isMobile ? (
				// 平板/手機版：下拉選單 + 日期選擇器同一行
				<Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap' }}>
					<FormControl size="small" sx={{ maxWidth: 100 }}>
						<InputLabel>年份</InputLabel>
						<Select value={currentYear} label="年份" onChange={handleYearSelectChange}>
							{yearOptions.map((year) => (
								<MenuItem key={year} value={year}>
									{year}年
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ maxWidth: 100 }}>
						<InputLabel>月份</InputLabel>
						<Select
							value={getCurrentMonthLabel(dateRange.start)}
							label="月份"
							onChange={handleMonthSelectChange}
						>
							{months.map((month) => (
								<MenuItem key={month.label} value={month.label}>
									{month.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<LocalizationProvider dateAdapter={AdapterDateFns}>
						<StyledDatePicker
							label="起始"
							value={dateRange.start}
							format="yyyy-MM-dd"
							onChange={handleStartDateChange}
							slotProps={{
								textField: {
									size: 'small',
									sx: { maxWidth: 150 },
								},
							}}
						/>
						<StyledDatePicker
							label="結束"
							value={dateRange.end}
							format="yyyy-MM-dd"
							onChange={handleEndDateChange}
							slotProps={{
								textField: {
									size: 'small',
									sx: { maxWidth: 150 },
								},
							}}
						/>
					</LocalizationProvider>
				</Stack>
			) : (
				// 電腦版：年份下拉選單 + 月份按鈕組
				<>
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
						{/* 年份下拉選單 */}
						<FormControl size="small" sx={{ minWidth: 120 }}>
							<InputLabel>年份</InputLabel>
							<Select value={currentYear} label="年份" onChange={handleYearSelectChange}>
								{yearOptions.map((year) => (
									<MenuItem key={year} value={year}>
										{year}年
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{/* 月份選擇器 - 按鈕組 */}
						<ToggleButtonGroup
							value={getCurrentMonthLabel(dateRange.start)}
							exclusive
							onChange={handleMonthChange}
							aria-label="月份選擇"
							size="small"
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: 0.5,
								justifyContent: 'flex-start',
								'& .MuiToggleButtonGroup-grouped': {
									border: 1,
									borderColor: 'primary.main',
									mx: 0,
									minWidth: '50px',
								},
							}}
						>
							{months.map((month) => (
								<StyledToggleButton key={month.label} value={month.label} aria-label={month.label}>
									{month.label}
								</StyledToggleButton>
							))}
						</ToggleButtonGroup>

						{/* 日期選擇器 */}
						<LocalizationProvider dateAdapter={AdapterDateFns}>
							<StyledDatePicker
								label="起始日期"
								value={dateRange.start}
								format="yyyy-MM-dd"
								onChange={handleStartDateChange}
								slotProps={{
									textField: {
										size: 'small',
										sx: { width: '180px' },
									},
								}}
							/>
							<StyledDatePicker
								label="結束日期"
								value={dateRange.end}
								format="yyyy-MM-dd"
								onChange={handleEndDateChange}
								slotProps={{
									textField: {
										size: 'small',
										sx: { width: '180px' },
									},
								}}
							/>
						</LocalizationProvider>
					</Stack>
				</>
			)}

			{/* 電腦版專用的日期選擇器 */}
			{/* {!isMobile && (
				<Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
					<LocalizationProvider dateAdapter={AdapterDateFns}>
						<StyledDatePicker
							label="起始日期"
							value={dateRange.start}
							format="yyyy-MM-dd"
							onChange={handleStartDateChange}
							slotProps={{
								textField: {
									size: 'small',
									sx: { width: '180px' },
								},
							}}
						/>
						<StyledDatePicker
							label="結束日期"
							value={dateRange.end}
							format="yyyy-MM-dd"
							onChange={handleEndDateChange}
							slotProps={{
								textField: {
									size: 'small',
									sx: { width: '180px' },
								},
							}}
						/>
					</LocalizationProvider>
				</Stack>
			)} */}
		</Stack>
	);
}

export default MonthPicker;
