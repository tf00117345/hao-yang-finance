import { useCallback, useEffect, useMemo, useState } from 'react';

import ClearAllIcon from '@mui/icons-material/ClearAll';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
	Box,
	Button,
	Checkbox,
	Divider,
	FormControlLabel,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Paper,
	Stack,
	Switch,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import { useCompaniesQuery } from '../../../Settings/api/query';
import { Company } from '../../../Settings/types/company';
import './CompanyLabelsPrint.css';

interface CompanyLabelsPrintProps {
	companyIds: string[];
}

interface LabelItem {
	company: Company;
	key: string;
}

/**
 * 列印公司貼紙（A4 橫向 2x7 → 實作為 7 欄 x 2 列）
 * - 使用 A4 landscape；容器寬高約 287mm x 200mm（扣除 5mm 邊界）
 * - Grid：7 欄 x 2 列，共 14 張
 */
function CompanyLabelsPrint({ companyIds }: CompanyLabelsPrintProps) {
	const { data: companies = [] } = useCompaniesQuery();

	// 候選清單：只顯示外部傳入的公司 ids
	const candidates: Company[] = useMemo(() => {
		const set = new Set(companyIds);
		return companies.filter((c) => set.has(c.id));
	}, [companies, companyIds]);

	// 勾選狀態：預設為全部勾選（與傳入的 companyIds 同步）
	const [selectedIds, setSelectedIds] = useState<string[]>(companyIds);
	useEffect(() => {
		setSelectedIds(companyIds);
	}, [companyIds]);

	// 每筆數量；預設為 1。同步候選鍵值。
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	useEffect(() => {
		setQuantities((prev) =>
			candidates.reduce<Record<string, number>>((acc, c) => {
				acc[c.id] = Math.max(1, Number.isFinite(prev[c.id]) ? prev[c.id] : 1);
				return acc;
			}, {}),
		);
	}, [candidates]);

	const setQuantity = useCallback((id: string, value: number) => {
		setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.floor(Number.isFinite(value) ? value : 1)) }));
	}, []);

	// 依勾選狀態產生要列印的公司（含穩定 key）
	const labels: LabelItem[] = useMemo(() => {
		const selectedSet = new Set(selectedIds);
		return candidates.flatMap((c) => {
			if (!selectedSet.has(c.id)) return [] as LabelItem[];
			const count = Math.max(1, quantities[c.id] ?? 1);
			return Array.from({ length: count }, (_, occurrenceIndex) => ({
				company: c,
				key: `${c.id}-${occurrenceIndex}`,
			}));
		});
	}, [candidates, selectedIds, quantities]);

	const toggleSelection = useCallback((id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	}, []);

	const selectAll = useCallback(() => {
		setSelectedIds(candidates.map((c) => c.id));
	}, [candidates]);

	const selectNone = useCallback(() => {
		setSelectedIds([]);
	}, []);

	const invertSelection = useCallback(() => {
		setSelectedIds((prev) => {
			const prevSet = new Set(prev);
			return candidates.filter((c) => !prevSet.has(c.id)).map((c) => c.id);
		});
	}, [candidates]);

	// 搜尋與只看已選
	const [query, setQuery] = useState('');
	const [onlySelected, setOnlySelected] = useState(false);
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value), []);
	const handleOnlySelectedChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setOnlySelected(e.target.checked),
		[],
	);
	const handleCheckboxChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => toggleSelection(e.target.value as string),
		[toggleSelection],
	);
	const handleQuantityChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.name as string, Number(e.target.value)),
		[setQuantity],
	);
	const handlePrint = useCallback(() => window.print(), []);

	const visibleList = useMemo(() => {
		const keyword = query.trim().toLowerCase();
		return candidates.filter((c) => {
			if (onlySelected && !selectedIds.includes(c.id)) return false;
			if (keyword.length === 0) return true;
			const hay =
				`${c.name ?? ''} ${c.address ?? ''} ${c.taxId ?? ''} ${(c.phone ?? []).join(' ')}`.toLowerCase();
			return hay.includes(keyword);
		});
	}, [candidates, onlySelected, query, selectedIds]);

	// 每頁 14 張貼紙進行分頁
	const pages: LabelItem[][] = useMemo(() => {
		const result = labels.length
			? Array.from({ length: Math.ceil(labels.length / 14) }, (_, i) => labels.slice(i * 14, (i + 1) * 14))
			: [[]];
		const last = result[result.length - 1];
		if (last.length < 14) {
			const blanks = Array.from({ length: 14 - last.length }, (_, i) => ({
				company: {
					id: uuidv4(),
					name: '',
					phone: [],
					isActive: true,
					createdAt: '',
					updatedAt: '',
				} as Company,
				key: `blank-${i}-${uuidv4()}`,
			}));
			result[result.length - 1] = [...last, ...blanks];
		}
		return result;
	}, [labels]);

	const selectedCount = selectedIds.length;
	const totalLabelCount = useMemo(() => {
		return selectedIds.reduce((sum, id) => sum + Math.max(1, quantities[id] ?? 1), 0);
	}, [quantities, selectedIds]);
	const pageCount = Math.max(1, Math.ceil(totalLabelCount / 14));

	return (
		<Stack direction="column" spacing={0} sx={{ width: '100%', height: '100%', p: 0, m: 0, flex: 1, minHeight: 0 }}>
			{/* 操作區：勾選並列印（不參與列印輸出） */}
			<Box sx={{ p: 1 }}>
				<Paper variant="outlined" sx={{ p: 1 }}>
					<Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<SearchIcon fontSize="small" />
							<TextField
								placeholder="搜尋 名稱/地址/統編/電話"
								size="small"
								value={query}
								onChange={handleSearchChange}
							/>
						</Box>
						<FormControlLabel
							control={<Switch size="small" checked={onlySelected} onChange={handleOnlySelectedChange} />}
							label="只看已選"
						/>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
							<Tooltip title="全選">
								<IconButton size="small" onClick={selectAll} disabled={candidates.length === 0}>
									<SelectAllIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Tooltip title="全不選">
								<IconButton size="small" onClick={selectNone} disabled={candidates.length === 0}>
									<ClearAllIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Tooltip title="反選">
								<IconButton size="small" onClick={invertSelection} disabled={candidates.length === 0}>
									<SwapHorizIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Box>
						<Box sx={{ flex: 1 }} />
						<Typography variant="body2">
							已選 {selectedCount} 家，共 {totalLabelCount} 張，頁數 {pageCount}
						</Typography>
						<Button
							startIcon={<PrintIcon />}
							size="small"
							variant="contained"
							onClick={handlePrint}
							disabled={totalLabelCount === 0}
						>
							列印
						</Button>
					</Stack>
				</Paper>
			</Box>

			{/* 兩欄式：左側清單（不參與列印）、右側預覽（僅印此區） */}
			<Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0, px: 1, pb: 1 }}>
				<Paper
					variant="outlined"
					sx={{
						width: '420px',
						maxWidth: '45%',
						p: 1,
						display: 'flex',
						flexDirection: 'column',
						height: '100%',
						overflow: 'hidden',
					}}
				>
					<List dense sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
						{visibleList.map((c) => {
							const checked = selectedIds.includes(c.id);
							return (
								<Box key={c.id}>
									<ListItem sx={{ alignItems: 'flex-start' }}>
										<ListItemIcon sx={{ minWidth: 32 }}>
											<Checkbox
												size="small"
												edge="start"
												checked={checked}
												value={c.id}
												onChange={handleCheckboxChange}
											/>
										</ListItemIcon>
										<ListItemText
											primary={
												<Stack
													direction="row"
													spacing={1}
													alignItems="center"
													justifyContent="space-between"
												>
													<Typography variant="subtitle2">{c.name}</Typography>
													<TextField
														size="small"
														type="number"
														inputProps={{
															min: 1,
															step: 1,
															style: { width: 56, textAlign: 'right' },
														}}
														value={quantities[c.id] ?? 1}
														name={c.id}
														onChange={handleQuantityChange}
														disabled={!checked}
														label="數量"
													/>
												</Stack>
											}
											secondary={
												<Box>
													<Typography variant="caption" color="text.secondary">
														{c.address || '無地址'}
													</Typography>
													{(c.taxId || (c.phone ?? []).length > 0) && (
														<Typography variant="caption" color="text.secondary">
															{c.taxId ? `統編：${c.taxId}` : ''}
															{c.taxId && (c.phone ?? []).length > 0 ? ' ・ ' : ''}
															{(c.phone ?? [])[0] ? `電話：${(c.phone ?? [])[0]}` : ''}
														</Typography>
													)}
												</Box>
											}
										/>
									</ListItem>
									<Divider component="li" />
								</Box>
							);
						})}
					</List>
				</Paper>

				{/* 僅限此區塊參與列印 */}
				<Box id="company-labels-print" sx={{ flex: 1, minHeight: 0, p: 0, overflow: 'auto' }}>
					<Stack direction="column" spacing={0}>
						{pages.map((page) => {
							const pageKey = page.map((it) => it.key).join('-') || `blank-page-${uuidv4()}`;
							return (
								<Box key={pageKey} className="labels-page">
									{page.map((it) => (
										<Box key={it.key} className="label">
											<Box className="label-content">
												{it.company.name && (
													<Typography className="company-name">
														{it.company.name || '\u00A0'}&nbsp;收
													</Typography>
												)}
												<Typography className="company-address">
													{it.company.address || '\u00A0'}
												</Typography>
											</Box>
										</Box>
									))}
								</Box>
							);
						})}
					</Stack>
				</Box>
			</Stack>
		</Stack>
	);
}

export default CompanyLabelsPrint;
