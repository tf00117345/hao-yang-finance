import { useEffect } from 'react';

import { Table } from '@tanstack/react-table';

import { Driver } from '../../Settings/types/driver';
import { Waybill } from '../../Waybill/types/waybill.types';

export function useTableFilters(table: Table<Waybill>, selectedDriver: Driver | null) {
	// 處理司機過濾
	useEffect(() => {
		const driverColumn = table.getColumn('driverName');
		const filterValue = selectedDriver?.name ?? null;

		driverColumn?.setFilterValue(filterValue);
	}, [selectedDriver, table]);
}
