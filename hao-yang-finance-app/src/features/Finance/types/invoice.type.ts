export interface Invoice {
	id: string; // UUID
	customerId: string;
	customerName: string;
	date: string; // 發票開立日期
	amount: number; // 自動計算 (fee + extraExpenses) * 1.2
	description: string;
	waybillIds: string[]; // 關聯的 Waybill id
	status: 'issued' | 'sent' | 'paid'; // 狀態追蹤
	createdAt: string;
	updatedAt: string;
	sentAt?: string; // 寄出發票時間
	paidAt?: string; // 收到款項時間
}

export const mockInvoices: Invoice[] = [
	{
		id: 'inv-001',
		customerId: '58c7e17d-b99d-65b1-22c7-9c6d8c68a876',
		customerName: '經濟部中央地質調查所',
		date: '2025-08-01',
		amount: 19800, // 假設 waybill 1: 15000+2500=17500*1.2=21000
		description: '7月運輸服務',
		waybillIds: ['1', '6'],
		status: 'issued',
		createdAt: '2025-08-01T10:00:00Z',
		updatedAt: '2025-08-01T10:00:00Z',
		sentAt: undefined,
		paidAt: undefined,
		voidAt: undefined,
	},
	{
		id: 'inv-002',
		customerId: 'some-customer-id',
		customerName: '永豐營造',
		date: '2025-08-02',
		amount: 14400, // 假設 waybill 2: 12000*1.2=14400
		description: '7月運輸服務',
		waybillIds: ['2'],
		status: 'sent',
		createdAt: '2025-08-02T09:00:00Z',
		updatedAt: '2025-08-02T09:30:00Z',
		sentAt: '2025-08-02T09:30:00Z',
		paidAt: undefined,
		voidAt: undefined,
	},
];
