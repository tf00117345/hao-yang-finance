import { useQuery } from '@tanstack/react-query';

import { DateRange } from '../../../types/date-range';
import { Waybill } from '../types/waybill.types';
import { getWaybills, getWaybillsByIds, getSuggestedWaybillsForInvoice } from './api';

// 取得託運單列表
export const useWaybillsQuery = (
	dateRange: DateRange,
	driverId?: string,
	locationSearch?: string,
	companySearch?: string,
) => {
	return useQuery<Waybill[]>({
		queryKey: [
			'waybills',
			dateRange.start.toISOString(),
			dateRange.end.toISOString(),
			driverId,
			locationSearch,
			companySearch,
		],
		queryFn: () => getWaybills(dateRange, driverId, locationSearch, companySearch),
	});
};

// 依多個 ID 取得託運單（不受日期/司機篩選）
export const useWaybillsByIdsQuery = (waybillIds: string[]) => {
	return useQuery<Waybill[]>({
		queryKey: ['waybills-by-ids', waybillIds],
		queryFn: () => getWaybillsByIds(waybillIds),
		enabled: Array.isArray(waybillIds) && waybillIds.length > 0,
	});
};

// 取得建議的託運單（用於開發票時顯示前一年未開票的託運單）
export const useSuggestedWaybillsQuery = (companyId: string, enabled: boolean = true) => {
	return useQuery<Waybill[]>({
		queryKey: ['suggested-waybills', companyId],
		queryFn: () => getSuggestedWaybillsForInvoice(companyId),
		enabled: enabled && !!companyId,
	});
};
