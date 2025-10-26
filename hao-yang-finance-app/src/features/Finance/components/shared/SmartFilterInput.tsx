import { useCallback, useMemo, useState } from 'react';

import { Assignment, AttachMoney, CalendarToday, Clear, FilterList, Flag, Info, Receipt } from '@mui/icons-material';
import { Box, Chip, IconButton, InputAdornment, Stack, TextField, Tooltip } from '@mui/material';

interface SmartFilterInputProps {
	columnId: string;
	columnHeader: string;
	value: string;
	onChange: (value: string) => void;
	onClear: () => void;
}

// 根據 columnId 判斷篩選類型
const getFilterType = (columnId: string) => {
	switch (columnId) {
		case 'date':
		case 'issuedDate':
		case 'paidDate':
			return 'date';
		case 'fee':
		case 'subtotal':
		case 'tax':
		case 'total':
			return 'number';
		case 'extraExpenses':
			return 'expense';
		case 'status':
			return 'status';
		case 'invoiceNumber':
			return 'invoice';
		default:
			return 'text';
	}
};

export function SmartFilterInput({ columnId, columnHeader, value, onChange, onClear }: SmartFilterInputProps) {
	const [showTips, setShowTips] = useState(false);
	const filterType = useMemo(() => getFilterType(columnId), [columnId]);

	// 獲取快速篩選選項
	const quickFilters = useMemo(() => {
		switch (filterType) {
			case 'status':
				return [
					{ label: '未收款', value: 'issued' },
					{ label: '已收款', value: 'paid' },
					{ label: '已作廢', value: 'void' },
				];
			default:
				return [];
		}
	}, [filterType]);

	// 獲取提示文字
	const getTipText = useCallback(() => {
		switch (filterType) {
			case 'date':
				return (
					<Box sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
						<div>• 直接輸入：2024、2024-01、01-15</div>
						<div>• 中文格式：1月、12月</div>
						<div>• 替代格式：2024/1</div>
					</Box>
				);
			case 'number':
				return (
					<Box sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
						<div>
							• 範圍：{'>'}1000、{'>'}=1000、{'<'}5000、{'<'}=5000
						</div>
						<div>• 區間：1000-5000、1000~5000</div>
						<div>• 千分位：1,000</div>
					</Box>
				);
			case 'expense':
				return (
					<Box sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
						<div>• 項目名稱：油料、過路費、停車費</div>
						<div>• 金額搜尋：{'>'}100、1000-5000</div>
						<div>• 無費用：0、無、沒有</div>
					</Box>
				);
			case 'status':
				return (
					<Box sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
						<div>• 已開立：issued、開立</div>
						<div>• 已收款：paid、收款</div>
						<div>• 已作廢：void、作廢</div>
					</Box>
				);
			case 'invoice':
				return (
					<Box sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
						<div>• 發票號碼搜尋</div>
						<div>• 支援部分匹配</div>
						<div>• 如：AA12345、123</div>
					</Box>
				);
			default:
				return '輸入關鍵字進行篩選';
		}
	}, [filterType]);

	// 獲取圖示
	const getIcon = useCallback(() => {
		switch (filterType) {
			case 'date':
				return <CalendarToday sx={{ fontSize: '1rem', color: 'text.disabled' }} />;
			case 'number':
				return <AttachMoney sx={{ fontSize: '1rem', color: 'text.disabled' }} />;
			case 'expense':
				return <Receipt sx={{ fontSize: '1rem', color: 'text.disabled' }} />;
			case 'status':
				return <Flag sx={{ fontSize: '1rem', color: 'text.disabled' }} />;
			case 'invoice':
				return <Assignment sx={{ fontSize: '1rem', color: 'text.disabled' }} />;
			default:
				return <FilterList sx={{ fontSize: '1rem', color: 'text.disabled' }} />;
		}
	}, [filterType]);

	// 獲取預留位置文字
	const getPlaceholder = useCallback(() => {
		switch (filterType) {
			case 'date':
				return '如：2024、1月、2024-01';
			case 'number':
				return '如：>1000、1000-5000';
			case 'expense':
				return '如：油料、>100、無';
			case 'status':
				return '如：已開立、paid、作廢';
			case 'invoice':
				return '如：AA12345、123';
			default:
				return `篩選 ${columnHeader}`;
		}
	}, [filterType, columnHeader]);

	return (
		<Box sx={{ position: 'relative' }}>
			{/* 狀態篩選：只顯示選擇式 Chip */}
			{filterType === 'status' ? (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
					{quickFilters.map((filter) => (
						<Chip
							key={filter.value}
							label={filter.label}
							size="small"
							variant={value === filter.value ? 'filled' : 'outlined'}
							color={value === filter.value ? 'primary' : 'default'}
							onClick={() => {
								if (value === filter.value) {
									onClear();
								} else {
									onChange(filter.value);
								}
							}}
							sx={{
								fontSize: '0.7rem',
								height: '24px',
								cursor: 'pointer',
								'&:hover': {
									backgroundColor: value === filter.value ? 'primary.dark' : 'action.hover',
								},
							}}
						/>
					))}
				</Box>
			) : (
				<>
					<TextField
						size="small"
						placeholder={getPlaceholder()}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						InputProps={{
							startAdornment: <InputAdornment position="start">{getIcon()}</InputAdornment>,
							endAdornment: (
								<InputAdornment position="end">
									<Stack direction="row" spacing={0.5} alignItems="center">
										{/* 提示按鈕 */}
										<Tooltip
											title={getTipText()}
											arrow
											placement="top"
											open={showTips}
											onClose={() => setShowTips(false)}
											onOpen={() => setShowTips(true)}
											disableFocusListener
											disableHoverListener
											disableTouchListener
										>
											<IconButton
												size="small"
												onClick={() => setShowTips(!showTips)}
												sx={{ p: 0.25 }}
											>
												<Info sx={{ fontSize: '0.75rem', color: 'text.disabled' }} />
											</IconButton>
										</Tooltip>

										{/* 清除按鈕 */}
										{value && (
											<IconButton size="small" onClick={onClear} sx={{ p: 0.25 }}>
												<Clear sx={{ fontSize: '0.875rem' }} />
											</IconButton>
										)}
									</Stack>
								</InputAdornment>
							),
						}}
						sx={{
							width: '100%',
							'& .MuiInputBase-root': {
								fontSize: '0.75rem',
							},
						}}
					/>

					{/* 快速篩選選項（非狀態欄位） */}
					{quickFilters.length > 0 && (
						<Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
							{quickFilters.map((filter) => (
								<Chip
									key={filter.value}
									label={filter.label}
									size="small"
									variant={value === filter.value ? 'filled' : 'outlined'}
									color={value === filter.value ? 'primary' : 'default'}
									onClick={() => {
										if (value === filter.value) {
											onClear();
										} else {
											onChange(filter.value);
										}
									}}
									sx={{
										fontSize: '0.7rem',
										height: '20px',
										cursor: 'pointer',
										'&:hover': {
											backgroundColor: value === filter.value ? 'primary.dark' : 'action.hover',
										},
									}}
								/>
							))}
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
