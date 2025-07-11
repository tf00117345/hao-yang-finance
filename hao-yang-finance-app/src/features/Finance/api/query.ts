import { useQuery } from '@tanstack/react-query';
import { Invoice } from '../types/invoice.type';
import { getInvoices, getUninvoicedWaybills } from './api';
import { Waybill } from '../../Waybill/types/waybill.types';
import { DateRange } from '../../../types/date-range';

// 取得發票列表
export const useInvoicesQuery = (dateRange: DateRange) => {
	return useQuery<Invoice[]>({
		queryKey: ['invoices'],
		queryFn: () => getInvoices(dateRange),
	});
};

export const useUninvoicedWaybillsQuery = (dateRange: DateRange, driverId?: string) => {
	return useQuery<Waybill[]>({
		queryKey: ['uninvoicedWaybills'],
		queryFn: () => getUninvoicedWaybills(dateRange, driverId),
	});
};
