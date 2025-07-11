import React from 'react';

import { Checkbox, FormControlLabel } from '@mui/material';

import classes from './BaseCheckbox.module.scss';

interface Props {
	id?: string;
	label: string;
	value: boolean;
	onValueChange: (check: boolean) => void;
	disabled?: boolean;
}

function BaseCheckbox({ id, label, value, onValueChange, disabled = false }: Props) {
	const onChange = (event: React.ChangeEvent<HTMLInputElement>, isCheck: boolean) => {
		onValueChange(isCheck);
	};

	return (
		<FormControlLabel
			disabled={disabled}
			classes={{ root: classes.formControlLabelRoot }}
			control={
				<Checkbox
					id={id}
					classes={{ root: classes.checkboxRoot }}
					color="primary"
					onChange={onChange}
					checked={value}
					size="small"
				/>
			}
			label={label || ''}
			labelPlacement="end"
		/>
	);
}

export default BaseCheckbox;
