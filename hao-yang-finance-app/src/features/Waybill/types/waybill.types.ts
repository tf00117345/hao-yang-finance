import { WaybillStatus } from './waybill-status.types';

export interface Waybill {
	id: string;
	// waybillNumber: string;
	date: string;
	item: string;
	plateNumber: string;
	tonnage: number;
	companyName: string;
	companyId: string;
	loadingLocations: LoadingLocation[];
	workingTime: {
		start: string;
		end: string;
	};
	fee: number;
	driverName: string;
	driverId: string;
	notes?: string;
	extraExpenses: ExtraExpense[];
	status: WaybillStatus; // 替代 isInvoiceIssued
	invoiceId?: string;
	taxAmount?: number;
	taxRate?: number;
	paymentNotes?: string;
	paymentReceivedAt?: string;
	paymentMethod?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface WaybillFormData extends Omit<Waybill, 'id' | 'companyId'> {
	id?: string;
	companyId?: string;
	markAsNoInvoiceNeeded?: boolean;
}

export interface LoadingLocation {
	from: string;
	to: string;
}

export interface ExtraExpense {
	id: string;
	item: string;
	fee: number;
	notes?: string;
}
