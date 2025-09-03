import { axiosInstance } from '../../../utils/axios-instance';
import {
	CreateInvoiceRequest,
	Invoice,
	InvoiceQueryParams,
	InvoiceStats,
	MarkInvoicePaidRequest,
	UpdateInvoiceRequest,
} from '../types/invoice.type';

// 獲取發票列表
export const getInvoices = async (params?: InvoiceQueryParams): Promise<Invoice[]> => {
	const queryParams = new URLSearchParams();

	if (params?.startDate) queryParams.append('startDate', params.startDate);
	if (params?.endDate) queryParams.append('endDate', params.endDate);
	if (params?.companyId) queryParams.append('companyId', params.companyId);
	if (params?.status) queryParams.append('status', params.status);
	if (params?.invoiceNumber) queryParams.append('invoiceNumber', params.invoiceNumber);

	const response = await axiosInstance.get('/invoice', { params: queryParams });
	return response.data;
};

// 獲取最後一個發票號碼
export const getLastInvoiceNumber = async (): Promise<string> => {
	const response = await axiosInstance.get('/invoice/last-invoice-number');
	return response.data;
};

// 獲取單一發票
export const getInvoice = async (id: string): Promise<Invoice> => {
	const response = await axiosInstance.get(`/invoice/${id}`);
	return response.data;
};

// 建立發票
export const createInvoice = async (data: CreateInvoiceRequest): Promise<Invoice> => {
	const response = await axiosInstance.post('/invoice', data);
	return response.data;
};

// 更新發票
export const updateInvoice = async (id: string, data: UpdateInvoiceRequest): Promise<void> => {
	await axiosInstance.put(`/invoice/${id}`, data);
};

// 刪除發票
export const deleteInvoice = async (id: string): Promise<void> => {
	await axiosInstance.delete(`/invoice/${id}`);
};

// 標記發票已收款
export const markInvoicePaid = async (id: string, data: MarkInvoicePaidRequest): Promise<void> => {
	await axiosInstance.post(`/invoice/${id}/mark-paid`, data);
};

// 作廢發票
export const voidInvoice = async (id: string): Promise<void> => {
	await axiosInstance.post(`/invoice/${id}/void`);
};

// 恢復發票
export const restoreInvoice = async (id: string): Promise<void> => {
	await axiosInstance.post(`/invoice/${id}/restore`);
};

// 獲取發票統計
export const getInvoiceStats = async (startDate?: string, endDate?: string): Promise<InvoiceStats> => {
	const params = new URLSearchParams();
	if (startDate) params.append('startDate', startDate);
	if (endDate) params.append('endDate', endDate);

	const response = await axiosInstance.get('/invoice/stats', { params });
	return response.data;
};
