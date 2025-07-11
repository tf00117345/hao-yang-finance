import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './App.css';
import MessageAlert from './component/MessageAlert/MessageAlert';
import NavigationAppBar from './component/NavigationAppBar/NavigationAppBar';
import WaybillPage from './features/Waybill/components/WaybillPage/WaybillPage';
import FinancePage from './features/Finance/components/FinancePage/FinancePage';
import { SettingPage } from './features/Settings/components/SettingPage/SettingPage';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchInterval: false,
			refetchIntervalInBackground: false,
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ReactQueryDevtools initialIsOpen={false} />
			<RecoilRoot>
				<MessageAlert />
				<BrowserRouter basename="/">
					<Routes>
						<Route path="/" element={<NavigationAppBar />}>
							<Route index element={<Navigate replace to="/waybill" />} />
							{/* <Route path="/main" element={<MainPage />} /> */}
							<Route path="/waybill/*" element={<WaybillPage />} />
							<Route path="/finance" element={<FinancePage />} />
							<Route path="/settings/*" element={<SettingPage />} />
						</Route>
					</Routes>
				</BrowserRouter>
			</RecoilRoot>
		</QueryClientProvider>
	);
}

export default App;
