import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Company } from '../Company/Company';
import { Driver } from '../Driver/Driver';

export function SettingPage() {
	const location = useLocation();
	const navigate = useNavigate();

	// 根據當前路徑設置 tab 值
	const getCurrentTab = () => {
		if (location.pathname.includes('/settings/company')) return 0;
		if (location.pathname.includes('/settings/driver')) return 1;
		return 0;
	};

	useEffect(() => {
		if (location.pathname === '/settings') {
			navigate('/settings/company');
		}
	}, [location.pathname, navigate]);

	// 處理 tab 變更
	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		if (newValue === 0) navigate('/settings/company');
		if (newValue === 1) navigate('/settings/driver');
	};

	return (
		<Stack sx={{ width: '100%' }} spacing={1}>
			{/* Tab 導航 */}
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
				<Tabs value={getCurrentTab()} onChange={handleTabChange} aria-label="settings navigation tabs">
					<Tab label="公司清單管理" />
					<Tab label="駕駛清單管理" />
				</Tabs>
			</Box>

			{/* 路由內容 */}
			<Stack sx={{ flex: 1, width: '100%', height: '100%' }} spacing={1}>
				<Routes>
					<Route path="/company" element={<Company />} />
					<Route path="/driver" element={<Driver />} />
				</Routes>
			</Stack>
		</Stack>
	);
}
