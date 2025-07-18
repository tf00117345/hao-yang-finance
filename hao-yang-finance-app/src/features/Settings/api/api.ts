import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { queryClient } from '../../../App';
import { axiosInstance } from '../../../utils/axios-instance';
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../types/company';
import { Driver, CreateDriverDto, UpdateDriverDto } from '../types/driver';
import { useNotifications } from '../../../hooks/useNotifications';

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
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: deleteCompany,
		onSuccess: () => {
			notifySuccess('公司刪除成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

export const useInsertCompanyMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: insertCompany,
		onSuccess: () => {
			notifySuccess('公司新增成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

export const useUpdateCompanyMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: ({ id, company }: { id: string; company: UpdateCompanyDto }) => updateCompany(id, company),
		onSuccess: () => {
			notifySuccess('公司資料更新成功');
		},
		onError: (error) => {
			notifyError(error);
		},
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
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: insertDriver,
		onSuccess: () => {
			notifySuccess('司機新增成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

export const useUpdateDriverMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: ({ id, driver }: { id: string; driver: UpdateDriverDto }) => updateDriver(id, driver),
		onSuccess: () => {
			notifySuccess('司機資料更新成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};

export const useDeleteDriverMutation = () => {
	const { notifySuccess, notifyError } = useNotifications();

	return useMutation({
		mutationFn: deleteDriver,
		onSuccess: () => {
			notifySuccess('司機刪除成功');
		},
		onError: (error) => {
			notifyError(error);
		},
	});
};
