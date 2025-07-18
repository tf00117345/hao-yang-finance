import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { queryClient } from '../../../App';
import { axiosInstance } from '../../../utils/axios-instance';
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../types/company';
import { Driver, CreateDriverDto, UpdateDriverDto } from '../types/driver';

const getCompanies = async (): Promise<Company[]> => {
	const response = await axiosInstance.get<Company[]>('/company');
	return response.data;
};

export const useCompaniesQuery = () => {
	return useSuspenseQuery({
		queryKey: ['companies'],
		queryFn: getCompanies,
	});
};

const insertCompany = async (company: CreateCompanyDto): Promise<Company> => {
	const response = await axiosInstance.post<Company>('/company', company);
	queryClient.invalidateQueries({ queryKey: ['companies'] });
	return response.data;
};

const deleteCompany = async (companyId: string): Promise<void> => {
	await axiosInstance.delete(`/company/${companyId}`);
	queryClient.invalidateQueries({ queryKey: ['companies'] });
};

const updateCompany = async (companyId: string, company: UpdateCompanyDto): Promise<void> => {
	await axiosInstance.put(`/company/${companyId}`, company);
	queryClient.invalidateQueries({ queryKey: ['companies'] });
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
		mutationFn: ({ id, company }: { id: string; company: UpdateCompanyDto }) => updateCompany(id, company),
	});
};

const getDrivers = async (): Promise<Driver[]> => {
	const response = await axiosInstance.get<Driver[]>('/driver');
	return response.data;
};

const insertDriver = async (driver: CreateDriverDto): Promise<Driver> => {
	const response = await axiosInstance.post<Driver>('/driver', driver);
	queryClient.invalidateQueries({ queryKey: ['drivers'] });
	return response.data;
};

const updateDriver = async (driverId: string, driver: UpdateDriverDto): Promise<void> => {
	await axiosInstance.put(`/driver/${driverId}`, driver);
	queryClient.invalidateQueries({ queryKey: ['drivers'] });
};

const deleteDriver = async (driverId: string): Promise<void> => {
	await axiosInstance.delete(`/driver/${driverId}`);
	queryClient.invalidateQueries({ queryKey: ['drivers'] });
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
		mutationFn: ({ id, driver }: { id: string; driver: UpdateDriverDto }) => updateDriver(id, driver),
	});
};

export const useDeleteDriverMutation = () => {
	return useMutation({
		mutationFn: deleteDriver,
	});
};
