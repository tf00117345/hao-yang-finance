export interface Invoice {
	id: string; // UUID
	companyId: string;
	companyName: string;
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
