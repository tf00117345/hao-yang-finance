import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import './App.css';

import { QueryClientInstance } from './cache/queryClient';
import MessageAlert from './component/MessageAlert/MessageAlert';
import NavigationAppBar from './component/NavigationAppBar/NavigationAppBar';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { LoginPage } from './features/Auth/components/LoginPage/LoginPage';
import { ProtectedRoute } from './features/Auth/components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './features/Auth/context/AuthContext';
import FinancePage from './features/Finance/components/FinancePage/FinancePage';
import { SettingPage } from './features/Settings/components/SettingPage/SettingPage';
import { StatisticsPage } from './features/Statistics/components/StatisticsPage';
import WaybillPage from './features/Waybill/components/WaybillPage/WaybillPage';

function App() {
	return (
		<QueryClientProvider client={QueryClientInstance}>
			<ReactQueryDevtools initialIsOpen={false} />
			<RecoilRoot>
				<SnackbarProvider>
					<AuthProvider>
						<MessageAlert />
						<BrowserRouter basename="/">
							<Routes>
								{/* Public route - Login */}
								<Route path="/login" element={<LoginPage />} />

								{/* Protected routes */}
								<Route
									path="/"
									element={
										<ProtectedRoute>
											<NavigationAppBar />
										</ProtectedRoute>
									}
								>
									<Route index element={<Navigate replace to="/waybill" />} />
									<Route path="/waybill/*" element={<WaybillPage />} />
									<Route path="/finance" element={<FinancePage />} />
									<Route path="/statistics" element={<StatisticsPage />} />
									<Route path="/settings/*" element={<SettingPage />} />
								</Route>

								{/* Catch all route - redirect to login */}
								<Route path="*" element={<Navigate to="/login" replace />} />
							</Routes>
						</BrowserRouter>
					</AuthProvider>
				</SnackbarProvider>
			</RecoilRoot>
		</QueryClientProvider>
	);
}

export default App;
