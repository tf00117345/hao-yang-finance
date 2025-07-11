import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { queryClient } from '../../../App';
import { companiesData } from '../constant/company-data';
import { driversData } from '../constant/drivers-data';
import { Company } from '../types/company';
import { Driver } from '../types/driver';

const getCompanies = (): Promise<Company[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(companiesData);
		}, 100);
	});
};

export const useCompaniesQuery = () => {
	return useSuspenseQuery({
		queryKey: ['companies'],
		queryFn: getCompanies,
	});
};

const insertCompany = async (company: Company): Promise<Company> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			queryClient.setQueryData(['companies'], (old: Company[]) => [...old, company]);
			resolve(company);
		}, 100);
	});
};

const deleteCompany = async (companyId: string): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			queryClient.setQueryData(['companies'], (old: Company[]) =>
				old.filter((company) => company.id !== companyId),
			);
			resolve();
		}, 100);
	});
};

const updateCompany = async (company: Company): Promise<Company> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			queryClient.setQueryData(['companies'], (old: Company[]) =>
				old.map((c) => (c.id === company.id ? company : c)),
			);
			resolve(company);
		}, 100);
	});
};

export const useDeleteCompanyMutation = () => {
	return useMutation({
		mutationFn: deleteCompany,
	});
};

export const useInsertCompanyMutation = () => {
	return useMutation({
		mutationFn: insertCompany,
	});
};

export const useUpdateCompanyMutation = () => {
	return useMutation({
		mutationFn: updateCompany,
	});
};

const getDrivers = (): Promise<Driver[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(driversData);
		}, 100);
	});
};

const insertDriver = async (driver: Driver): Promise<Driver> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			queryClient.setQueryData(['drivers'], (old: Driver[]) => [...old, driver]);
			resolve(driver);
		}, 100);
	});
};

const updateDriver = async (driver: Driver): Promise<Driver> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			queryClient.setQueryData(['drivers'], (old: Driver[]) => old.map((d) => (d.id === driver.id ? driver : d)));
			resolve(driver);
		}, 100);
	});
};

const deleteDriver = async (driverId: string): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			queryClient.setQueryData(['drivers'], (old: Driver[]) => old.filter((driver) => driver.id !== driverId));
			resolve();
		}, 100);
	});
};

export const useDriversQuery = () => {
	return useSuspenseQuery({
		queryKey: ['drivers'],
		queryFn: getDrivers,
	});
};

export const useInsertDriverMutation = () => {
	return useMutation({
		mutationFn: insertDriver,
	});
};

export const useUpdateDriverMutation = () => {
	return useMutation({
		mutationFn: updateDriver,
	});
};

export const useDeleteDriverMutation = () => {
	return useMutation({
		mutationFn: deleteDriver,
	});
};
