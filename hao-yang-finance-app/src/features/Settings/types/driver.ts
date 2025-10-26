export interface Driver {
	id: string;
	name: string;
	phone?: string;
	profitShareRatio?: number;
	truckTonnage?: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateDriverDto {
	name: string;
	phone?: string;
	profitShareRatio?: number;
	truckTonnage?: number;
}

export interface UpdateDriverDto {
	name: string;
	phone?: string;
	profitShareRatio?: number;
	truckTonnage?: number;
	isActive: boolean;
}
