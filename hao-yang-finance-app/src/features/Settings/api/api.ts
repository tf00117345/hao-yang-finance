import { queryClient } from '../../../App';
import { axiosInstance } from '../../../utils/axios-instance';
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../types/company';
import { Driver, CreateDriverDto, UpdateDriverDto } from '../types/driver';

export const getCompanies = async (): Promise<Company[]> => {
	const response = await axiosInstance.get<Company[]>('/company');
	return response.data;
};

export const insertCompany = async (company: CreateCompanyDto): Promise<Company> => {
	const response = await axiosInstance.post<Company>('/company', company);
	queryClient.invalidateQueries({ queryKey: ['companies'] });
	return response.data;
};

export const deleteCompany = async (companyId: string): Promise<void> => {
	await axiosInstance.delete(`/company/${companyId}`);
	queryClient.invalidateQueries({ queryKey: ['companies'] });
};

export const updateCompany = async (companyId: string, company: UpdateCompanyDto): Promise<void> => {
	await axiosInstance.put(`/company/${companyId}`, company);
	queryClient.invalidateQueries({ queryKey: ['companies'] });
};

export const getDrivers = async (): Promise<Driver[]> => {
	const response = await axiosInstance.get<Driver[]>('/driver');
	return response.data;
};

export const insertDriver = async (driver: CreateDriverDto): Promise<Driver> => {
	const response = await axiosInstance.post<Driver>('/driver', driver);
	queryClient.invalidateQueries({ queryKey: ['drivers'] });
	return response.data;
};

export const updateDriver = async (driverId: string, driver: UpdateDriverDto): Promise<void> => {
	await axiosInstance.put(`/driver/${driverId}`, driver);
	queryClient.invalidateQueries({ queryKey: ['drivers'] });
};

export const deleteDriver = async (driverId: string): Promise<void> => {
	await axiosInstance.delete(`/driver/${driverId}`);
	queryClient.invalidateQueries({ queryKey: ['drivers'] });
};
