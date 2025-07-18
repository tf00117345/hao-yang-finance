export interface Company {
	id: string;
	name: string;
	taxId?: string;
	contactPerson?: string;
	phone: string[];
	address?: string;
	email?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCompanyDto {
	name: string;
	taxId?: string;
	contactPerson?: string;
	phone: string[];
	address?: string;
	email?: string;
}

export interface UpdateCompanyDto {
	name: string;
	taxId?: string;
	contactPerson?: string;
	phone: string[];
	address?: string;
	email?: string;
	isActive: boolean;
}
