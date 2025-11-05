import { useQuery } from '@tanstack/react-query';

import { getCompanies, getDrivers } from './api';

export const useCompaniesQuery = () => {
	return useQuery({
		queryKey: ['companies'],
		queryFn: getCompanies,
	});
};

export const useDriversQuery = () => {
	return useQuery({
		queryKey: ['drivers'],
		queryFn: getDrivers,
	});
};
