import type { LoadingLocation } from '../../Waybill/types/waybill.types';

// 請款單狀態
export enum CollectionRequestStatus {
	Requested = 'requested',
	Paid = 'paid',
	Cancelled = 'cancelled',
}

// 請款單狀態標籤
export const CollectionRequestStatusLabels: Record<CollectionRequestStatus, string> = {
	[CollectionRequestStatus.Requested]: '已請款',
	[CollectionRequestStatus.Paid]: '已收款',
	[CollectionRequestStatus.Cancelled]: '已取消',
};

// 請款單狀態顏色
export const CollectionRequestStatusColors: Record<CollectionRequestStatus, 'warning' | 'success' | 'error'> = {
	[CollectionRequestStatus.Requested]: 'warning',
	[CollectionRequestStatus.Paid]: 'success',
	[CollectionRequestStatus.Cancelled]: 'error',
};

// 請款單基本資訊
export interface CollectionRequest {
	id: string;
	requestNumber: string;
	requestDate: string;
	companyId: string;
	companyName: string;
	totalAmount: number;
	subtotal: number;
	taxAmount: number;
	taxRate: number;
	status: CollectionRequestStatus;
	notes?: string;
	paymentReceivedAt?: string;
	paymentMethod?: string;
	paymentNotes?: string;
	waybillCount: number;
	waybillIds: string[];
	createdAt: string;
	updatedAt: string;
}

// 請款單詳細資訊（包含託運單列表）
export interface CollectionRequestDetail extends CollectionRequest {
	waybills: CollectionRequestWaybill[];
}

// 請款單中的託運單資訊
export interface CollectionRequestWaybill {
	id: string;
	date: string;
	item: string;
	fee: number;
	taxAmount?: number;
	driverName: string;
	plateNumber: string;
	companyId?: string;
	companyName?: string;
	loadingLocations?: LoadingLocation[];
}

// 建立請款單請求
export interface CreateCollectionRequestDto {
	requestNumber?: string;
	requestDate: string;
	companyId: string;
	waybillIds: string[];
	notes?: string;
}

// 標記已收款請求
export interface MarkCollectionPaidDto {
	paymentReceivedAt: string;
	paymentMethod: string;
	paymentNotes?: string;
}

// 取消請款單請求
export interface CancelCollectionRequestDto {
	cancelReason?: string;
}

// 批量操作結果
export interface BatchOperationResultDto {
	message: string;
	collectionRequestId: string;
	affectedWaybills: number;
	details: BatchOperationDetailDto[];
}

// 批量操作詳細資訊
export interface BatchOperationDetailDto {
	waybillId: string;
	success: boolean;
	message: string;
}

// 請款單查詢參數
export interface CollectionRequestQueryParams {
	companyId?: string;
	status?: CollectionRequestStatus;
	startDate?: string;
	endDate?: string;
}

// 請款單業務規則
export const CollectionRequestRules = {
	// 可以標記為已收款的狀態
	canMarkPaid: (status: CollectionRequestStatus): boolean => {
		return status === CollectionRequestStatus.Requested;
	},

	// 可以取消的狀態
	canCancel: (status: CollectionRequestStatus): boolean => {
		return status === CollectionRequestStatus.Requested;
	},

	// 可以刪除的狀態
	canDelete: (status: CollectionRequestStatus): boolean => {
		return true;
	},

	// 可以編輯的狀態
	canEdit: (status: CollectionRequestStatus): boolean => {
		return status === CollectionRequestStatus.Requested;
	},
};

// 請款單狀態轉換規則
export const CollectionRequestStatusTransitions = {
	[CollectionRequestStatus.Requested]: [CollectionRequestStatus.Paid, CollectionRequestStatus.Cancelled],
	[CollectionRequestStatus.Paid]: [], // 已收款無法再轉換
	[CollectionRequestStatus.Cancelled]: [], // 已取消無法再轉換
} as const;
