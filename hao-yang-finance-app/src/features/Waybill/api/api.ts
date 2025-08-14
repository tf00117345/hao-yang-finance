import { QueryClientInstance } from '../../../cache/queryClient';
import { DateRange } from '../../../types/date-range';
import { axiosInstance } from '../../../utils/axios-instance';
import { Waybill, WaybillFormData } from '../types/waybill.types';

export const getWaybills = async (dateRange: DateRange, driverId?: string): Promise<Waybill[]> => {
	const params = new URLSearchParams();
	params.append('startDate', dateRange.start.toISOString().split('T')[0]);
	params.append('endDate', dateRange.end.toISOString().split('T')[0]);
	if (driverId) {
		params.append('driverId', driverId);
	}

	const response = await axiosInstance.get('/waybill', { params });
	return response.data.map(transformWaybillFromApi);
};

// 轉換 API 回應格式為前端格式
const transformWaybillFromApi = (apiWaybill: any): Waybill => {
	return {
		id: apiWaybill.id,
		waybillNumber: apiWaybill.waybillNumber,
		date: apiWaybill.date,
		item: apiWaybill.item,
		tonnage: apiWaybill.tonnage,
		companyName: apiWaybill.companyName,
		companyId: apiWaybill.companyId,
		loadingLocations: apiWaybill.loadingLocations.map((location: any) => ({
			from: location.from,
			to: location.to,
		})),
		workingTime: {
			start: apiWaybill.workingTimeStart,
			end: apiWaybill.workingTimeEnd,
		},
		fee: apiWaybill.fee,
		driverName: apiWaybill.driverName,
		driverId: apiWaybill.driverId,
		plateNumber: apiWaybill.plateNumber,
		notes: apiWaybill.notes,
		extraExpenses: apiWaybill.extraExpenses,
		status: apiWaybill.status,
		invoiceId: apiWaybill.invoiceId,
		createdAt: apiWaybill.createdAt,
		updatedAt: apiWaybill.updatedAt,
	};
};

// 轉換前端格式為 API 格式
const transformWaybillToApi = (waybill: WaybillFormData): any => {
	return {
		waybillNumber: waybill.waybillNumber,
		date: waybill.date,
		item: waybill.item,
		tonnage: waybill.tonnage,
		companyId: waybill.companyId,
		workingTimeStart: waybill.workingTime.start,
		workingTimeEnd: waybill.workingTime.end,
		fee: waybill.fee,
		driverId: waybill.driverId,
		plateNumber: waybill.plateNumber,
		notes: waybill.notes,
		loadingLocations: waybill.loadingLocations.map((location) => ({
			from: location.from,
			to: location.to,
		})),
		extraExpenses: waybill.extraExpenses,
	};
};

export const updateWaybill = async (params: { waybillId: string; waybill: WaybillFormData }): Promise<Waybill> => {
	const apiData = transformWaybillToApi(params.waybill);
	const response = await axiosInstance.put(`/waybill/${params.waybillId}`, apiData);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
	return transformWaybillFromApi(response.data.data || response.data);
};

export const insertWaybill = async (waybill: WaybillFormData): Promise<Waybill> => {
	const apiData = transformWaybillToApi(waybill);
	const response = await axiosInstance.post('/waybill', apiData);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
	return transformWaybillFromApi(response.data.data || response.data);
};

export const deleteWaybill = async (waybillId: string): Promise<void> => {
	await axiosInstance.delete(`/waybill/${waybillId}`);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
};

export const markWaybillAsNoInvoiceNeeded = async (waybillId: string): Promise<void> => {
	await axiosInstance.put(`/waybill/${waybillId}/no-invoice`);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
};

export const restoreWaybill = async (waybillId: string): Promise<void> => {
	await axiosInstance.put(`/waybill/${waybillId}/restore`);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
};

// 批次標記託運單為無須開發票
export const markWaybillsAsNoInvoiceNeededBatch = async (waybillIds: string[]): Promise<any> => {
	const response = await axiosInstance.put('/waybill/no-invoice-batch', waybillIds);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
	return response.data;
};

// 批次還原託運單
export const restoreWaybillsBatch = async (waybillIds: string[]): Promise<any> => {
	const response = await axiosInstance.put('/waybill/restore-batch', waybillIds);
	QueryClientInstance.invalidateQueries({ queryKey: ['waybills'] });
	return response.data;
};
