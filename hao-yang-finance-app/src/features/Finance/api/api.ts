import { DateRange } from '../../../types/date-range';
import { axiosInstance } from '../../../utils/axios-instance';
import { Waybill } from '../../Waybill/types/waybill.types';
import { Invoice } from '../types/invoice.type';

export const getInvoices = async (dateRange: DateRange): Promise<Invoice[]> => {
	const params = new URLSearchParams();
	params.append('dateRange', dateRange.toString());
	params.append('isInvoiceIssued', 'true');

	const response = await axiosInstance.get('/invoices', { params });
	return response.data;
};

export const getUninvoicedWaybills = async (dateRange: DateRange, driverId?: string): Promise<Waybill[]> => {
	const params = new URLSearchParams();
	params.append('dateRange', dateRange.toString());
	params.append('isInvoiceIssued', 'false');

	if (driverId) {
		params.append('driverId', driverId);
	}

	const response = await axiosInstance.get('/waybills/uninvoiced', { params });
	return response.data;
};
