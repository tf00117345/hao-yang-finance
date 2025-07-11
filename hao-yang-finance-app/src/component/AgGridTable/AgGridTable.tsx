import { useMemo, useRef } from 'react';

import { Stack } from '@mui/material';
import type {
	ColDef,
	GridReadyEvent,
	RowSelectionOptions,
	SizeColumnsToContentStrategy,
	Theme,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

interface AgGridTableProps<T> {
	colDefs: ColDef<T>[];
	rowData: T[];
	defaultColDef: ColDef<T>;
	theme?: Theme;
	loading?: boolean;
	rowSelection?: RowSelectionOptions<T>;
	onCellClicked?: (event: any) => void;
	onRowClicked?: (event: any) => void;
	onGridReady?: (params: GridReadyEvent) => void;
	onColumnResized?: (params: any) => void;
	children?: React.ReactNode;
}

function AgGridTable<T = any>({
	colDefs,
	rowData,
	defaultColDef,
	theme,
	loading,
	rowSelection,
	onCellClicked,
	onRowClicked,
	onGridReady,
	onColumnResized,
}: AgGridTableProps<T>) {
	const gridRef = useRef<AgGridReact<T>>(null);

	const autoSizeStrategy = useMemo(() => {
		return {
			type: 'fitCellContents',
		} as SizeColumnsToContentStrategy;
	}, []);

	return (
		<Stack sx={{ flex: 1, width: '100%', height: '100%' }} spacing={1}>
			<AgGridReact
				ref={gridRef}
				rowData={rowData}
				columnDefs={colDefs}
				theme={theme}
				loading={loading ?? false}
				defaultColDef={defaultColDef}
				rowSelection={rowSelection}
				onRowClicked={onRowClicked}
				onCellClicked={onCellClicked}
				autoSizeStrategy={autoSizeStrategy}
				onGridReady={(params) => {
					onGridReady?.(params);
					// 初始載入時自動調整列寬
					params.api.sizeColumnsToFit();
				}}
				onColumnResized={onColumnResized}
				// 當視窗大小改變時自動調整
				onGridSizeChanged={(params) => {
					params.api.sizeColumnsToFit();
				}}
			/>
		</Stack>
	);
}

export default AgGridTable;
