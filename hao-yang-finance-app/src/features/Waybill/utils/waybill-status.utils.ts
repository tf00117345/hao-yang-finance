import { WaybillStatus, WaybillStatusRules } from '../types/waybill-status.types';

/**
 * 託運單狀態轉換工具函數
 */
export class WaybillStatusUtils {
	/**
	 * 檢查是否可以編輯託運單
	 */
	static canEdit(status: WaybillStatus): boolean {
		return WaybillStatusRules.canEdit(status);
	}

	/**
	 * 檢查是否可以刪除託運單
	 */
	static canDelete(status: WaybillStatus): boolean {
		return WaybillStatusRules.canDelete(status);
	}

	/**
	 * 檢查是否可以開發票
	 */
	static canInvoice(status: WaybillStatus): boolean {
		return WaybillStatusRules.canInvoice(status);
	}

	/**
	 * 檢查是否可以標記為不需開發票
	 */
	static canMarkNoInvoiceNeeded(status: WaybillStatus): boolean {
		return WaybillStatusRules.canMarkNoInvoiceNeeded(status);
	}

	/**
	 * 檢查是否可以標記為待收款
	 */
	static canMarkPendingPayment(status: WaybillStatus): boolean {
		return WaybillStatusRules.canMarkPendingPayment(status);
	}

	/**
	 * 檢查是否可以編輯備註
	 */
	static canEditNotes(status: WaybillStatus): boolean {
		return WaybillStatusRules.canEditNotes(status);
	}

	/**
	 * 檢查是否可以還原為待開發票
	 */
	static canRestore(status: WaybillStatus): boolean {
		return WaybillStatusRules.canRestore(status);
	}

	/**
	 * 根據狀態取得可用的操作按鈕
	 */
	static getAvailableActions(status: WaybillStatus): {
		canEdit: boolean;
		canDelete: boolean;
		canInvoice: boolean;
		canMarkNoInvoiceNeeded: boolean;
		canMarkPendingPayment: boolean;
		canEditNotes: boolean;
		canRestore: boolean;
	} {
		return {
			canEdit: this.canEdit(status),
			canDelete: this.canDelete(status),
			canInvoice: this.canInvoice(status),
			canMarkNoInvoiceNeeded: this.canMarkNoInvoiceNeeded(status),
			canMarkPendingPayment: this.canMarkPendingPayment(status),
			canEditNotes: this.canEditNotes(status),
			canRestore: this.canRestore(status),
		};
	}

	/**
	 * 批次檢查託運單是否可以開發票
	 * @param waybills 託運單陣列
	 * @returns 可開發票的託運單
	 */
	static getInvoiceableWaybills<T extends { status: WaybillStatus }>(waybills: T[]): T[] {
		return waybills.filter((waybill) => this.canInvoice(waybill.status));
	}

	/**
	 * 批次檢查託運單是否為同一公司且可開發票
	 * @param waybills 託運單陣列
	 * @returns 分組後的可開發票託運單
	 */
	static groupInvoiceableWaybillsByCompany<
		T extends {
			status: WaybillStatus;
			companyId: string;
		},
	>(waybills: T[]): Record<string, T[]> {
		const invoiceableWaybills = this.getInvoiceableWaybills(waybills);

		return invoiceableWaybills.reduce(
			(groups, waybill) => {
				const { companyId } = waybill;
				if (!groups[companyId]) {
					// eslint-disable-next-line no-param-reassign
					groups[companyId] = [];
				}
				// eslint-disable-next-line no-param-reassign
				groups[companyId].push(waybill);
				return groups;
			},
			{} as Record<string, T[]>,
		);
	}

	/**
	 * 檢查託運單狀態是否允許轉換
	 * @param fromStatus 目前狀態
	 * @param toStatus 目標狀態
	 * @returns 是否允許轉換
	 */
	static canTransitionTo(fromStatus: WaybillStatus, toStatus: WaybillStatus): boolean {
		const transitions = {
			[WaybillStatus.PENDING]: [
				WaybillStatus.INVOICED,
				WaybillStatus.NO_INVOICE_NEEDED,
				WaybillStatus.PENDING_PAYMENT,
			],
			[WaybillStatus.INVOICED]: [WaybillStatus.PENDING], // 當發票被刪除/作廢時
			[WaybillStatus.NO_INVOICE_NEEDED]: [WaybillStatus.PENDING], // 還原功能
			[WaybillStatus.PENDING_PAYMENT]: [WaybillStatus.PENDING], // 還原功能
		};

		return transitions[fromStatus]?.includes(toStatus) || false;
	}

	/**
	 * 取得狀態轉換的原因說明
	 * @param fromStatus 原始狀態
	 * @param toStatus 目標狀態
	 * @returns 轉換原因說明
	 */
	static getTransitionReason(fromStatus: WaybillStatus, toStatus: WaybillStatus): string {
		const transitions = {
			'PENDING->INVOICED': '託運單已開立發票',
			'PENDING->NO_INVOICE_NEEDED': '託運單標記為不需開發票',
			'PENDING->PENDING_PAYMENT': '託運單標記為待收款狀態',
			'INVOICED->PENDING': '發票已刪除或作廢，託運單恢復為待開發票狀態',
			'NO_INVOICE_NEEDED->PENDING': '託運單恢復為待開發票狀態',
			'PENDING_PAYMENT->PENDING': '待收款託運單恢復為待開發票狀態',
		};

		const key = `${fromStatus}->${toStatus}` as keyof typeof transitions;
		return transitions[key] || '狀態轉換';
	}
}

/**
 * 狀態轉換的 Hook 工具函數
 */
export const useWaybillStatusActions = () => {
	/**
	 * 標記託運單為不需開發票
	 */
	const markNoInvoiceNeeded = async (waybillId: string) => {
		// TODO: 實作 API 呼叫
		// eslint-disable-next-line no-console
		console.log('標記託運單為不需開發票:', waybillId);
	};

	/**
	 * 標記託運單為待收款
	 */
	const markPendingPayment = async (waybillId: string) => {
		// TODO: 實作 API 呼叫
		// eslint-disable-next-line no-console
		console.log('標記託運單為待收款:', waybillId);
	};

	/**
	 * 更新託運單備註
	 */
	const updateNotes = async (waybillId: string, notes: string) => {
		// TODO: 實作 API 呼叫
		// eslint-disable-next-line no-console
		console.log('更新託運單備註:', waybillId, notes);
	};

	/**
	 * 還原託運單為待開發票
	 */
	const restoreToPending = async (waybillId: string) => {
		// TODO: 實作 API 呼叫
		// eslint-disable-next-line no-console
		console.log('還原託運單為待開發票:', waybillId);
	};

	/**
	 * 批次開立發票
	 */
	const createInvoice = async (waybillIds: string[]) => {
		// TODO: 實作 API 呼叫
		// eslint-disable-next-line no-console
		console.log('批次開立發票:', waybillIds);
	};

	return {
		markNoInvoiceNeeded,
		markPendingPayment,
		updateNotes,
		restoreToPending,
		createInvoice,
	};
};
