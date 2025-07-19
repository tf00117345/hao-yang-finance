import { useMemo } from 'react';

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { DateRange } from '../../types/date-range';
import { startOfDay, endOfDay } from '../../utils/date-utils';

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

	// 處理年份變更
	const handleYearChange = (_: React.MouseEvent<HTMLElement>, newYear: number | null) => {
		if (!newYear) return;

		const monthData = months.find((m) => m.label === getCurrentMonthLabel(dateRange.start));
		if (monthData) {
			onDateChange(startOfDay(monthData.start(newYear)), endOfDay(monthData.end(newYear)));
		}
	};

	// 處理月份變更
	const handleMonthChange = (_: React.MouseEvent<HTMLElement>, newMonth: string | null) => {
		if (!newMonth) return;

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
		<Stack spacing={1}>
			{/* 年份選擇器 */}
			<ToggleButtonGroup
				value={currentYear}
				exclusive
				onChange={handleYearChange}
				aria-label="年份選擇"
				size="small"
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 0.5,
					'& .MuiToggleButtonGroup-grouped': {
						border: 1,
						borderColor: 'primary.main',
						mx: 0,
					},
				}}
			>
				{yearOptions.map((year) => (
					<StyledToggleButton key={year} value={year} aria-label={`${year}年`}>
						{year}年
					</StyledToggleButton>
				))}
			</ToggleButtonGroup>

			{/* 月份選擇器和日期選擇器 */}
			<Stack
				direction="row"
				spacing={1}
				sx={{ flex: 1, justifyContent: 'space-between', display: 'flex', flexWrap: 'wrap' }}
			>
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
						'& .MuiToggleButtonGroup-grouped': {
							border: 1,
							borderColor: 'primary.main',
							mx: 0,
						},
					}}
				>
					{months.map((month) => (
						<StyledToggleButton key={month.label} value={month.label} aria-label={month.label}>
							{month.label}
						</StyledToggleButton>
					))}
				</ToggleButtonGroup>
				<Stack direction="row" spacing={1}>
					<LocalizationProvider dateAdapter={AdapterDateFns}>
						<StyledDatePicker
							label="起始"
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
							label="結束"
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
			</Stack>
		</Stack>
	);
}

export default MonthPicker;
