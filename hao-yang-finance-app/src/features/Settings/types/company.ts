export interface Company {
	id: string;
	name: string;
	taxNumber?: string;
	address?: string;
	phone: string[]; // 移除可選標記，確保總是陣列
	email?: string;
}
