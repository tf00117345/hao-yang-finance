import { RefObject } from 'react';

import * as R from 'ramda';

export const generateUUID = () => {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}

	return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export const coerceArray = (ary: string | any[]) => {
	if (Array.isArray(ary)) {
		return ary;
	}
	return [ary];
};

export const getRefElement = (element?: RefObject<Element>): Element | undefined | null => {
	if (element && 'current' in element) {
		return element.current;
	}

	return element;
};

export const isEmptyOrNil = (value: any) => {
	return R.isEmpty(value) || R.isNil(value);
};

export const isNotEmptyOrNil = (value: any) => {
	return !R.isEmpty(value) && !R.isNil(value);
};

export const isEmptyList = (value: any[] | undefined) => {
	if (!value) return false;
	return value?.length === 0;
};

export const isNotEmptyList = (value: any[] | undefined) => {
	if (!value) return false;
	return value?.length > 0;
};

export const reorder = <T>(list: Array<T>, startIndex: number, endIndex: number): Array<T> => {
	const result = [...list];
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);
	return result.slice();
};
