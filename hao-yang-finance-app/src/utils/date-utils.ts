import { format, parse } from 'date-fns';

export const stringFormatDate = (value: string, fromFormat: string): Date => parse(value, fromFormat, new Date());

export const convertToDateTime = (value: string | Date, fromFormat = 'yyyyMMdd') => {
	try {
		if (value instanceof Date) {
			return format(value, fromFormat);
		}
		return format(new Date(value), fromFormat);
	} catch {
		return '';
	}
};

export const convertToDate = (value: string | Date, fromFormat = 'yyyyMMdd') => {
	try {
		if (value instanceof Date) {
			return format(value, fromFormat);
		}
		return format(new Date(value), fromFormat);
	} catch {
		return '';
	}
};

export const formatToDate = (value: string | Date | null | undefined): Date => {
	let date;
	if (value instanceof Date) {
		// 如果輸入的已經是 Date 物件，則直接返回
		date = value;
	} else if (typeof value === 'string') {
		// 否則，嘗試將輸入的字串解析為 Date 物件
		const parsedDate = new Date(value);
		// 檢查解析是否成功
		if (Number.isNaN(parsedDate.getTime())) {
			// 如果解析失敗（也就是說，parsedDate 是無效的 Date 物件），則拋出錯誤
			date = new Date();
		} else {
			// 如果解析成功，則返回解析後的 Date 物件
			date = parsedDate;
		}
	} else {
		date = new Date();
	}

	return date;
};

/**
 * 取得某天的最早時間（00:00:00.000）
 * @param date 傳入的日期
 * @returns 設為當天最早時間的 Date 物件
 */
export function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * 取得某天的最晚時間（23:59:59.999）
 * @param date 傳入的日期
 * @returns 設為當天最晚時間的 Date 物件
 */
export function endOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}
