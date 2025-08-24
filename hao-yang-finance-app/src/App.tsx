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
import CompanyLabelsPrintV2 from './features/Finance/components/CompanyLabelsPrintV2/CompanyLabelsPrintV2';

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
									<Route
										path="/company-labels-print"
										element={
											<CompanyLabelsPrintV2
												companyIds={[
													'2fea2e85-9eb5-51b1-676b-a37c3c58cd03',
													'6bccd92b-5593-6f87-10ce-f8bf172f7fea',
													'e23ae93e-b8bd-9786-abb1-2229cec8314f',
													'0fffc7c5-8582-e335-b6ad-952ec08e1172',
													'ca9c48cd-95a3-d6a0-db83-eb1982699c41',
													'9091ebe2-92cf-40dd-2e34-a26530f4f465',
													'2fea2e85-9eb5-51b1-676b-a37c3c58cd03',
													'bcd2132e-13ba-f77a-d102-efa73457afe2',
													'2986651d-f572-2294-5290-ca49c6980b5d',
													'106aba60-6aae-e24e-75ac-a98aac5951b4',
													'8f2bd466-8b5f-c514-bb88-d71949690f26',
													'03881331-8563-f56b-f4e9-26a132a65034',
													'af6b566e-868a-2900-66e7-72e82bd683e0',
													'8ffceead-9773-d583-a0f8-dc4e012d2cad',
													'bf24252b-5936-6ecb-2924-ac8458e62ff3',
													'86f2eedb-248a-adef-5ee4-67db6387e6f3',
													'6a675f6b-df54-715c-7719-cac33e73757b',
												]}
											/>
										}
									/>
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
