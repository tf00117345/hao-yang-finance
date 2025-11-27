import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { collectionRequestApi } from '../features/Finance/api/collection-request.api';
import {
	CollectionRequestQueryParams,
	CreateCollectionRequestDto,
	MarkCollectionPaidDto,
} from '../features/Finance/types/collection-request.types';

// Query Keys
export const collectionRequestKeys = {
	all: ['collectionRequests'] as const,
	lists: () => [...collectionRequestKeys.all, 'list'] as const,
	list: (params?: CollectionRequestQueryParams) => [...collectionRequestKeys.lists(), params] as const,
	details: () => [...collectionRequestKeys.all, 'detail'] as const,
	detail: (id: string) => [...collectionRequestKeys.details(), id] as const,
};

/**
 * 取得請款單列表
 */
export const useCollectionRequests = (params?: CollectionRequestQueryParams) => {
	return useQuery({
		queryKey: collectionRequestKeys.list(params),
		queryFn: () => collectionRequestApi.getCollectionRequests(params),
	});
};

/**
 * 取得請款單詳情
 */
export const useCollectionRequestDetail = (id: string, enabled = true) => {
	return useQuery({
		queryKey: collectionRequestKeys.detail(id),
		queryFn: () => collectionRequestApi.getCollectionRequestDetail(id),
		enabled: enabled && !!id,
	});
};

/**
 * 建立請款單
 */
export const useCreateCollectionRequest = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: CreateCollectionRequestDto) => collectionRequestApi.createCollectionRequest(dto),
		onSuccess: () => {
			// 使請款單列表和託運單列表快取失效
			queryClient.invalidateQueries({ queryKey: collectionRequestKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
		},
	});
};

/**
 * 標記請款單為已收款
 */
export const useMarkCollectionPaid = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: MarkCollectionPaidDto }) =>
			collectionRequestApi.markCollectionPaid(id, dto),
		onSuccess: (_, { id }) => {
			// 使請款單列表、詳情和託運單列表快取失效
			queryClient.invalidateQueries({ queryKey: collectionRequestKeys.lists() });
			queryClient.invalidateQueries({ queryKey: collectionRequestKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
		},
	});
};

/**
 * 刪除請款單
 */
export const useDeleteCollectionRequest = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => collectionRequestApi.deleteCollectionRequest(id),
		onSuccess: () => {
			// 使請款單列表快取失效
			queryClient.invalidateQueries({ queryKey: collectionRequestKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
		},
	});
};
