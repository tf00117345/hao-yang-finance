import { axiosInstance } from '../../../utils/axios-instance';
import {
	BatchOperationResultDto,
	CancelCollectionRequestDto,
	CollectionRequest,
	CollectionRequestDetail,
	CollectionRequestQueryParams,
	CreateCollectionRequestDto,
	MarkCollectionPaidDto,
} from '../types/collection-request.types';

const COLLECTION_REQUEST_API = '/CollectionRequest';

/**
 * 請款單 API
 */
export const collectionRequestApi = {
	/**
	 * 取得請款單列表
	 */
	getCollectionRequests: async (params?: CollectionRequestQueryParams): Promise<CollectionRequest[]> => {
		const queryString = new URLSearchParams();
		if (params?.companyId) queryString.append('companyId', params.companyId);
		if (params?.status) queryString.append('status', params.status);
		if (params?.startDate) queryString.append('startDate', params.startDate);
		if (params?.endDate) queryString.append('endDate', params.endDate);

		const url = queryString.toString()
			? `${COLLECTION_REQUEST_API}?${queryString.toString()}`
			: COLLECTION_REQUEST_API;

		const response = await axiosInstance.get<CollectionRequest[]>(url);
		return response.data;
	},

	/**
	 * 取得請款單詳情
	 */
	getCollectionRequestDetail: async (id: string): Promise<CollectionRequestDetail> => {
		const response = await axiosInstance.get<CollectionRequestDetail>(`${COLLECTION_REQUEST_API}/${id}`);
		return response.data;
	},

	/**
	 * 建立請款單（批量請款）
	 */
	createCollectionRequest: async (dto: CreateCollectionRequestDto): Promise<CollectionRequest> => {
		const response = await axiosInstance.post<CollectionRequest>(COLLECTION_REQUEST_API, dto);
		return response.data;
	},

	/**
	 * 標記請款單為已收款
	 */
	markCollectionPaid: async (id: string, dto: MarkCollectionPaidDto): Promise<BatchOperationResultDto> => {
		const response = await axiosInstance.post<BatchOperationResultDto>(
			`${COLLECTION_REQUEST_API}/${id}/mark-paid`,
			dto,
		);
		return response.data;
	},

	/**
	 * 取消請款單
	 */
	cancelCollectionRequest: async (id: string, dto?: CancelCollectionRequestDto): Promise<BatchOperationResultDto> => {
		const response = await axiosInstance.post<BatchOperationResultDto>(
			`${COLLECTION_REQUEST_API}/${id}/cancel`,
			dto || {},
		);
		return response.data;
	},

	/**
	 * 刪除請款單（只能刪除已取消的）
	 */
	deleteCollectionRequest: async (id: string): Promise<void> => {
		await axiosInstance.delete(`${COLLECTION_REQUEST_API}/${id}`);
	},
};
