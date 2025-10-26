import { axiosInstance } from '../../../utils/axios-instance';
import {
	CreateDriverSettlement,
	CreateExpense,
	DriverSettlement,
	DriverSettlementSummary,
	ExpenseType,
	UpdateDriverSettlement,
} from '../types/driver-settlement.types';

// Driver Settlement API functions
export const driverSettlementApi = {
	// Get all settlements
	getSettlements: async (targetMonth?: string): Promise<DriverSettlementSummary[]> => {
		const params = targetMonth ? { targetMonth } : {};
		const response = await axiosInstance.get<DriverSettlementSummary[]>('driverSettlement', { params });
		return response.data;
	},

	// Get settlement by ID
	getSettlement: async (settlementId: number): Promise<DriverSettlement> => {
		const response = await axiosInstance.get<DriverSettlement>(`driverSettlement/${settlementId}`);
		return response.data;
	},

	// Get settlement by driver and month
	getSettlementByDriverAndMonth: async (driverId: string, targetMonth: string): Promise<DriverSettlement> => {
		const response = await axiosInstance.get<DriverSettlement>(`driverSettlement/driver/${driverId}`, {
			params: { targetMonth },
		});
		return response.data;
	},

	// Create settlement
	createSettlement: async (data: CreateDriverSettlement): Promise<DriverSettlement> => {
		const response = await axiosInstance.post<DriverSettlement>('driverSettlement', data);
		return response.data;
	},

	// Update settlement
	updateSettlement: async (settlementId: number, data: UpdateDriverSettlement): Promise<DriverSettlement> => {
		const response = await axiosInstance.put<DriverSettlement>(`driverSettlement/${settlementId}`, data);
		return response.data;
	},

	// Delete settlement
	deleteSettlement: async (settlementId: number): Promise<void> => {
		await axiosInstance.delete(`driverSettlement/${settlementId}`);
	},

	// Get expense types
	getExpenseTypes: async (category?: string): Promise<ExpenseType[]> => {
		const params = category ? { category } : {};
		const response = await axiosInstance.get<ExpenseType[]>('driverSettlement/expense-types', { params });
		return response.data;
	},

	// Get default expenses for category
	getDefaultExpenses: async (category: string): Promise<CreateExpense[]> => {
		const response = await axiosInstance.get<CreateExpense[]>(`driverSettlement/default-expenses/${category}`);
		return response.data;
	},

	// Export settlement PDF
	exportSettlementPdf: async (settlementId: number): Promise<void> => {
		const response = await axiosInstance.post(`driverSettlement/${settlementId}/export-pdf`);
		return response.data;
	},
};
