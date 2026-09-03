import { Tooltip } from '@mui/material';

interface NoteCellProps {
	value?: string;
}

// 備註類欄位：空值顯示 '-'，有值則截斷並以 Tooltip 顯示全文
export function NoteCell({ value }: NoteCellProps) {
	if (!value) {
		return <>-</>;
	}

	return (
		<Tooltip title={value} arrow placement="top">
			<span
				style={{
					display: 'block',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}
			>
				{value}
			</span>
		</Tooltip>
	);
}
