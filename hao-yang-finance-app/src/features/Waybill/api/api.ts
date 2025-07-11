import { queryClient } from '../../../App';
import { DateRange } from '../../../types/date-range';
import { axiosInstance } from '../../../utils/axios-instance';
import { Waybill, WaybillFormData } from '../types/waybill.types';

export const getWaybills = async (dateRange: DateRange, driverId?: string): Promise<Waybill[]> => {
	const params = new URLSearchParams();
	params.append('dateRange', dateRange.toString());
	if (driverId) {
		params.append('driverId', driverId);
	}

	const response = await axiosInstance.get('/waybills', { params });
	return response.data;
};

export const updateWaybill = async (params: {
	waybillId: string;
	waybill: WaybillFormData;
}): Promise<WaybillFormData> => {
	const response = await axiosInstance.put(`/waybills/${params.waybillId}`, params.waybill);
	queryClient.invalidateQueries({ queryKey: ['waybills'] });
	return response.data;
};

export const insertWaybill = async (waybill: WaybillFormData): Promise<WaybillFormData> => {
	const response = await axiosInstance.post('/waybills', waybill);
	queryClient.invalidateQueries({ queryKey: ['waybills'] });
	return response.data;
};

export const deleteWaybill = async (waybillId: string): Promise<void> => {
	await axiosInstance.delete(`/waybills/${waybillId}`);
	queryClient.invalidateQueries({ queryKey: ['waybills'] });
};
