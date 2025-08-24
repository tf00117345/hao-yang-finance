import { useMemo } from 'react';

import PrintIcon from '@mui/icons-material/Print';
import { Box, Button, Stack, Typography } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import { useCompaniesQuery } from '../../../Settings/api/query';
import { Company } from '../../../Settings/types/company';
import './CompanyLabelsPrintV2.css';

interface CompanyLabelsPrintProps {
	companyIds: string[];
}

/**
 * 列印公司貼紙（A4 橫向 2x7 → 實作為 7 欄 x 2 列）
 * - 使用 A4 landscape；容器寬高約 277mm x 190mm（扣除 5mm 邊界）
 * - Grid：7 欄 x 2 列，共 14 張
 */
export function CompanyLabelsPrintV2({ companyIds }: CompanyLabelsPrintProps) {
	const { data: companies = [] } = useCompaniesQuery();

	// 過濾與排序要列印的公司資料
	const labels: Company[] = useMemo(() => {
		const set = new Set(companyIds);
		return companies.filter((c) => set.has(c.id));
	}, [companies, companyIds]);

	// 每頁 14 張貼紙進行分頁
	const pages: Company[][] = useMemo(() => {
		const chunkSize = 14;
		const result: Company[][] = [];
		for (let i = 0; i < labels.length; i += chunkSize) {
			result.push(labels.slice(i, i + chunkSize));
		}
		// 若最後一頁不足 14 張，以空白填滿，避免印刷位移
		if (result.length === 0) {
			result.push([]);
		}
		const last = result[result.length - 1];
		if (last.length < 14) {
			const blanks = new Array(14 - last.length).fill(null).map(
				() =>
					({
						id: uuidv4(),
						name: '',
						phone: [],
						isActive: true,
						createdAt: '',
						updatedAt: '',
					}) as unknown as Company,
			);
			result[result.length - 1] = [...last, ...blanks];
		}
		return result;
	}, [labels]);

	const handlePrint = () => window.print();

	return (
		<Stack direction="column" spacing={0}>
			<Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
				列印
			</Button>
			{/* 僅限此區塊參與列印 */}
			<Box id="company-labels-print" sx={{ p: 0, m: 0, width: '100%', height: '100%' }}>
				<Stack direction="column" spacing={0}>
					{pages.map((page) => {
						const pageKey = page.map((c) => c.id).join('-') || `blank-page-${uuidv4()}`;
						return (
							<Box key={pageKey} className="labels-page">
								{page.map((c) => (
									<Box key={c.id} className="label">
										<Box className="label-content">
											{c.name && (
												<Typography className="company-name">
													{c.name || '\u00A0'}&nbsp;收
												</Typography>
											)}
											<Typography className="company-address">{c.address || '\u00A0'}</Typography>
										</Box>
									</Box>
								))}
							</Box>
						);
					})}
				</Stack>
			</Box>
		</Stack>
	);
}

export default CompanyLabelsPrintV2;
