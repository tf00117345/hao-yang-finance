import { useQuery } from '@tanstack/react-query';
import { Waybill } from '../types/waybill.types';
import { getWaybills } from './api';
import { DateRange } from '../../../types/date-range';

// 取得託運單列表
export const useWaybillsQuery = (dateRange: DateRange, driverId?: string) => {
	return useQuery<Waybill[]>({
		queryKey: ['waybills', dateRange.start.toISOString(), dateRange.end.toISOString(), driverId],
		queryFn: () => getWaybills(dateRange, driverId),
	});
};
