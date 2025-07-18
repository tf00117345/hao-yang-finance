import { WaybillStatus } from './waybill-status.types';

export interface Waybill {
	id: string;
	waybillNumber: string;
	date: string;
	item: string;
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
	plateNumber: string;
	notes: string;
	extraExpenses: ExtraExpense[];
	status: WaybillStatus; // 替代 isInvoiceIssued
	invoiceId?: string;
}

export interface WaybillFormData extends Omit<Waybill, 'id' | 'companyId'> {
	id?: string;
	companyId?: string;
}

export interface LoadingLocation {
	from: string;
	to: string;
}

export interface ExtraExpense {
	item: string;
	fee: number;
	notes: string;
}
