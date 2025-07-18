export interface Driver {
	id: string;
	name: string;
	phone?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateDriverDto {
	name: string;
	phone?: string;
}

export interface UpdateDriverDto {
	name: string;
	phone?: string;
	isActive: boolean;
}
