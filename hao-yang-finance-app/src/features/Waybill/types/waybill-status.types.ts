// 託運單狀態定義
export enum WaybillStatus {
	PENDING = 'PENDING',
	INVOICED = 'INVOICED',
	NO_INVOICE_NEEDED = 'NO_INVOICE_NEEDED',
	PENDING_PAYMENT = 'PENDING_PAYMENT',
}

// 狀態描述對應
export const WaybillStatusDescriptions: Record<WaybillStatus, string> = {
	[WaybillStatus.PENDING]: '待開發票',
	[WaybillStatus.INVOICED]: '已開發票',
	[WaybillStatus.NO_INVOICE_NEEDED]: '不需開發票',
	[WaybillStatus.PENDING_PAYMENT]: '待收款',
};

// 狀態顯示名稱對應
export const WaybillStatusLabels: Record<WaybillStatus, string> = {
	[WaybillStatus.PENDING]: '待開發票',
	[WaybillStatus.INVOICED]: '已開發票',
	[WaybillStatus.NO_INVOICE_NEEDED]: '不需開發票',
	[WaybillStatus.PENDING_PAYMENT]: '待收款',
};

// 狀態顏色對應 (可配合 Material-UI Chip 使用)
export const WaybillStatusColors: Record<WaybillStatus, 'warning' | 'success' | 'default' | 'error'> = {
	[WaybillStatus.PENDING]: 'warning',
	[WaybillStatus.INVOICED]: 'success',
	[WaybillStatus.NO_INVOICE_NEEDED]: 'default',
	[WaybillStatus.PENDING_PAYMENT]: 'error',
};

// 狀態業務邏輯檢查
export const WaybillStatusRules = {
	// 可以編輯的狀態
	canEdit: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},

	// 可以刪除的狀態
	canDelete: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},

	// 可以開發票的狀態
	canInvoice: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},

	// 可以標記為不需開發票的狀態
	canMarkNoInvoiceNeeded: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},

	// 可以標記為待收款的狀態
	canMarkPendingPayment: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},

	// 可以編輯備註的狀態
	canEditNotes: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING_PAYMENT;
	},

	// 可以還原為待開發票的狀態
	canRestore: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.NO_INVOICE_NEEDED || status === WaybillStatus.PENDING_PAYMENT;
	},
};

// 狀態轉換規則
export const WaybillStatusTransitions = {
	[WaybillStatus.PENDING]: [WaybillStatus.INVOICED, WaybillStatus.NO_INVOICE_NEEDED, WaybillStatus.PENDING_PAYMENT],
	[WaybillStatus.INVOICED]: [WaybillStatus.PENDING], // 當發票被刪除/作廢時
	[WaybillStatus.NO_INVOICE_NEEDED]: [WaybillStatus.PENDING], // 還原功能
	[WaybillStatus.PENDING_PAYMENT]: [WaybillStatus.PENDING], // 還原功能
} as const;
