// 託運單狀態定義
export type WaybillStatus = 'PENDING' | 'INVOICED' | 'NO_INVOICE_NEEDED';

// 狀態顯示名稱對應
export const WaybillStatusLabels: Record<WaybillStatus, string> = {
	PENDING: '待開發票',
	INVOICED: '已開發票',
	NO_INVOICE_NEEDED: '不需開發票',
};

// 狀態顏色對應 (可配合 Material-UI Chip 使用)
export const WaybillStatusColors: Record<WaybillStatus, 'warning' | 'success' | 'default'> = {
	PENDING: 'warning',
	INVOICED: 'success',
	NO_INVOICE_NEEDED: 'default',
};

// 狀態業務邏輯檢查
export const WaybillStatusRules = {
	// 可以編輯的狀態
	canEdit: (status: WaybillStatus): boolean => {
		return status === 'PENDING';
	},

	// 可以刪除的狀態
	canDelete: (status: WaybillStatus): boolean => {
		return status === 'PENDING';
	},

	// 可以開發票的狀態
	canInvoice: (status: WaybillStatus): boolean => {
		return status === 'PENDING';
	},

	// 可以標記為不需開發票的狀態
	canMarkNoInvoiceNeeded: (status: WaybillStatus): boolean => {
		return status === 'PENDING';
	},

	// 可以還原為待開發票的狀態
	canRestore: (status: WaybillStatus): boolean => {
		return status === 'NO_INVOICE_NEEDED';
	},
};

// 狀態轉換規則
export const WaybillStatusTransitions = {
	PENDING: ['INVOICED', 'NO_INVOICE_NEEDED'],
	INVOICED: ['PENDING'], // 當發票被刪除/作廢時
	NO_INVOICE_NEEDED: ['PENDING'], // 還原功能
} as const;
