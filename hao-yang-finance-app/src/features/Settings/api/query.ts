import { useSuspenseQuery } from '@tanstack/react-query';

import { getCompanies, getDrivers } from './api';

export const useCompaniesQuery = () => {
	return useSuspenseQuery({
		queryKey: ['companies'],
		queryFn: getCompanies,
	});
};

export const useDriversQuery = () => {
	return useSuspenseQuery({
		queryKey: ['drivers'],
		queryFn: getDrivers,
	});
};
