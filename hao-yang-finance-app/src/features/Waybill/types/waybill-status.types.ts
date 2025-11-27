/**
 * 託運單狀態枚舉
 * Waybill Status Enum - Represents the lifecycle states of a waybill
 */
export enum WaybillStatus {
	/** 待處理 - Initial state, awaiting action (invoice, collection request, or mark as no invoice needed) */
	PENDING = 'PENDING',
	/** 已開發票 - Invoice has been issued for this waybill */
	INVOICED = 'INVOICED',
	/** 不需開發票 - No invoice required for this waybill */
	NO_INVOICE_NEEDED = 'NO_INVOICE_NEEDED',
	/**
	 * 不需開發票但需請款收稅，未收款
	 * No invoice required but needs to collect with tax, payment not received
	 * 注意：此狀態名稱可能造成混淆，實際業務意義為「已請款但未收到款項」
	 * Note: The naming may be confusing - it actually means "collection requested but payment not received"
	 * Status flow: PENDING → CreateCollectionRequest → NEED_TAX_UNPAID
	 */
	NEED_TAX_UNPAID = 'NEED_TAX_UNPAID',
	/**
	 * 不需開發票但需請款收稅，已收款
	 * No invoice required but needs to collect with tax, payment received
	 * 注意：此狀態名稱可能造成混淆，實際業務意義為「已請款且已收到款項」
	 * Note: The naming may be confusing - it actually means "collection requested and payment received"
	 * Status flow: NEED_TAX_UNPAID → MarkCollectionPaid → NEED_TAX_PAID
	 */
	NEED_TAX_PAID = 'NEED_TAX_PAID',
}

// 狀態描述對應
export const WaybillStatusDescriptions: Record<WaybillStatus, string> = {
	[WaybillStatus.PENDING]: '待開發票',
	[WaybillStatus.INVOICED]: '已開發票',
	[WaybillStatus.NO_INVOICE_NEEDED]: '不需開發票',
	[WaybillStatus.NEED_TAX_UNPAID]: '未收款',
	[WaybillStatus.NEED_TAX_PAID]: '已收款',
};

// 狀態顯示名稱對應
export const WaybillStatusLabels: Record<WaybillStatus, string> = {
	[WaybillStatus.PENDING]: '待開發票',
	[WaybillStatus.INVOICED]: '已開發票',
	[WaybillStatus.NO_INVOICE_NEEDED]: '不需開發票',
	[WaybillStatus.NEED_TAX_UNPAID]: '未收款',
	[WaybillStatus.NEED_TAX_PAID]: '已收款',
};

// 狀態顏色對應 (可配合 Material-UI Chip 使用)
export const WaybillStatusColors: Record<WaybillStatus, 'warning' | 'success' | 'default' | 'error' | 'info'> = {
	[WaybillStatus.PENDING]: 'warning',
	[WaybillStatus.INVOICED]: 'success',
	[WaybillStatus.NO_INVOICE_NEEDED]: 'default',
	[WaybillStatus.NEED_TAX_UNPAID]: 'error',
	[WaybillStatus.NEED_TAX_PAID]: 'success',
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

	// 可以標記為未收款的狀態
	canMarkUnpaidWithTax: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},

	// 可以標記為已收款的狀態
	canMarkPaidWithTax: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING || status === WaybillStatus.NEED_TAX_UNPAID;
	},

	// 可以編輯收款備註的狀態
	canEditPaymentNotes: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.NEED_TAX_UNPAID || status === WaybillStatus.NEED_TAX_PAID;
	},

	// 可以切換收款狀態的狀態
	canTogglePaymentStatus: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.NEED_TAX_UNPAID || status === WaybillStatus.NEED_TAX_PAID;
	},

	// 可以還原為待開發票的狀態
	canRestore: (status: WaybillStatus): boolean => {
		return (
			status === WaybillStatus.NO_INVOICE_NEEDED ||
			status === WaybillStatus.NEED_TAX_UNPAID ||
			status === WaybillStatus.NEED_TAX_PAID
		);
	},

	// 可以請款的狀態
	canRequestCollection: (status: WaybillStatus): boolean => {
		return status === WaybillStatus.PENDING;
	},
};

// 狀態轉換規則
export const WaybillStatusTransitions = {
	[WaybillStatus.PENDING]: [
		WaybillStatus.INVOICED,
		WaybillStatus.NO_INVOICE_NEEDED,
		WaybillStatus.NEED_TAX_UNPAID,
		WaybillStatus.NEED_TAX_PAID,
	],
	[WaybillStatus.INVOICED]: [WaybillStatus.PENDING], // 當發票被刪除/作廢時
	[WaybillStatus.NO_INVOICE_NEEDED]: [WaybillStatus.PENDING], // 還原功能
	[WaybillStatus.NEED_TAX_UNPAID]: [WaybillStatus.PENDING, WaybillStatus.NEED_TAX_PAID], // 還原或標記已收款
	[WaybillStatus.NEED_TAX_PAID]: [WaybillStatus.PENDING, WaybillStatus.NEED_TAX_UNPAID], // 還原或標記未收款
} as const;
