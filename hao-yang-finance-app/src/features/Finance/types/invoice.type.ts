// 發票主要介面
export interface Invoice {
	id: string;
	invoiceNumber: string;
	date: string;
	companyId: string;
	companyName: string;
	subtotal: number;
	taxRate: number;
	extraExpensesIncludeTax: boolean;
	tax: number;
	total: number;
	status: 'issued' | 'paid' | 'void';
	paymentMethod?: string;
	paymentNote?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
	paidAt?: string;
	waybills: InvoiceWaybill[];
}

// 發票託運單關聯
export interface InvoiceWaybill {
	waybillId: string;
	waybillNumber: string;
	date: string;
	item: string;
	fee: number;
	driverName: string;
	extraExpensesIncludeTax: boolean;
	extraExpenses: InvoiceExtraExpense[];
}

// 發票額外費用關聯
export interface InvoiceExtraExpense {
	extraExpenseId: string;
	item: string;
	fee: number;
	notes?: string;
	waybillNumber: string;
}

// 建立發票請求
export interface CreateInvoiceRequest {
	invoiceNumber: string;
	date: string;
	companyId: string;
	taxRate: number;
	extraExpensesIncludeTax: boolean;
	notes?: string;
	waybillIds: string[];
	extraExpenseIds: string[];
}

// 更新發票請求
export interface UpdateInvoiceRequest {
	invoiceNumber: string;
	date: string;
	taxRate: number;
	extraExpensesIncludeTax: boolean;
	notes?: string;
	waybillIds: string[];
	extraExpenseIds: string[];
}

// 標記收款請求
export interface MarkInvoicePaidRequest {
	paymentMethod: string;
	paymentNote?: string;
}

// 發票查詢參數
export interface InvoiceQueryParams {
	startDate?: string;
	endDate?: string;
	companyId?: string;
	status?: string;
	invoiceNumber?: string;
}

// 發票統計
export interface InvoiceStats {
	totalInvoices: number;
	paidInvoices: number;
	unpaidInvoices: number;
	voidInvoices: number;
	totalAmount: number;
	paidAmount: number;
	unpaidAmount: number;
}

// 日期範圍介面（用於查詢）
export interface DateRange {
	start: Date;
	end: Date;
}
