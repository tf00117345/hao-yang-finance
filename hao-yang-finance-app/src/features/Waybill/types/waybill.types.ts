export interface Waybill {
	id: string;
	waybillNumber: string;
	date: string;
	item: string;
	customerName: string;
	customerId: string;
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
	isInvoiceIssued: boolean;
	invoiceId?: string;
}

export interface WaybillFormData extends Omit<Waybill, 'id' | 'customerId'> {
	id?: string;
	customerId?: string;
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
