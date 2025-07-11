import { DateRange } from '../../../types/date-range';
import { axiosInstance } from '../../../utils/axios-instance';
import { SAMPLE_WAYBILLS } from '../../Waybill/constants/waybill.constants';
import { Waybill } from '../../Waybill/types/waybill.types';
import { Invoice, mockInvoices } from '../types/invoice.type';

export const getInvoices = async (dateRange: DateRange): Promise<Invoice[]> => {
	if (process.env.NODE_ENV === 'production') {
		const params = new URLSearchParams();
		params.append('dateRange', dateRange.toString());
		params.append('isInvoiceIssued', 'true');

		const response = await axiosInstance.get('/invoices', { params });
		return response.data;
	}

	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(
				mockInvoices.filter((i) => new Date(i.date) >= dateRange.start && new Date(i.date) <= dateRange.end),
			);
		}, 100);
	});
};

export const getUninvoicedWaybills = async (dateRange: DateRange, driverId?: string): Promise<Waybill[]> => {
	if (process.env.NODE_ENV === 'production') {
		const params = new URLSearchParams();
		params.append('dateRange', dateRange.toString());
		params.append('isInvoiceIssued', 'false');

		if (driverId) {
			params.append('driverId', driverId);
		}

		const response = await axiosInstance.get('/waybills/uninvoiced', { params });
		return response.data;
	}

	return new Promise((resolve) => {
		debugger;
		setTimeout(() => {
			resolve(
				SAMPLE_WAYBILLS.filter(
					(b) =>
						new Date(b.date) >= dateRange.start &&
						new Date(b.date) <= dateRange.end &&
						(!driverId || b.driverId === driverId) &&
						!b.isInvoiceIssued,
				),
			);
		}, 100);
	});
};
