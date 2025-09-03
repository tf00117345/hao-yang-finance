import { useQuery } from '@tanstack/react-query';

import { Invoice, InvoiceQueryParams, InvoiceStats } from '../types/invoice.type';
import { getInvoice, getInvoices, getInvoiceStats, getLastInvoiceNumber } from './api';

// 取得發票列表
export const useInvoicesQuery = (params?: InvoiceQueryParams) => {
	return useQuery<Invoice[]>({
		queryKey: ['invoices', params],
		queryFn: () => getInvoices(params),
	});
};

// 取得單一發票
export const useInvoiceQuery = (id: string) => {
	return useQuery<Invoice>({
		queryKey: ['invoice', id],
		queryFn: () => getInvoice(id),
		enabled: !!id,
	});
};

// 取得發票統計
export const useInvoiceStatsQuery = (startDate?: string, endDate?: string) => {
	return useQuery<InvoiceStats>({
		queryKey: ['invoice-stats', startDate, endDate],
		queryFn: () => getInvoiceStats(startDate, endDate),
	});
};

export const useLastInvoiceNumberQuery = () => {
	return useQuery<string>({
		queryKey: ['last-invoice-number'],
		queryFn: () => getLastInvoiceNumber(),
		staleTime: 0,
		retryOnMount: true,
		refetchOnMount: 'always',
	});
};
