import classes from './BaseTextInput.module.scss';

interface Props {
	id?: string;
	value: string;
	disabled?: boolean;
	placeholder?: string;
	onValueChange: (str: string) => void;
	onFocus?: (event) => void;
	onKeyPress?: (event) => void;
	suffix?: string;
	prefix?: string;
	customClass?: string;
}

function BaseTextInput({
	id,
	value = '',
	disabled = false,
	placeholder = '',
	onValueChange,
	onFocus = () => {},
	onKeyPress = () => {},
	suffix = '',
	prefix = '',
	customClass,
}: Props) {
	return (
		<div className={classes.container}>
			{prefix && <span className={classes.span}>{prefix}</span>}
			<input
				autoComplete="off"
				id={id}
				placeholder={placeholder}
				disabled={disabled}
				className={customClass || classes[`text-input`]}
				type="text"
				tabIndex={0}
				maxLength={200}
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				onKeyPressCapture={(event) => onKeyPress(event)}
				onFocus={(event) => onFocus(event)}
			/>
			{suffix && <span className={classes.span}>{suffix}</span>}
		</div>
	);
}

export default BaseTextInput;
