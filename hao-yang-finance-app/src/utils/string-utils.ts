// 將字符串轉換為 camelCase
export const toCamelCase = (str: string) => {
	return str
		.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.toUpperCase()))
		.replace(/\s+/g, '');
};

export const toCapitalize = (str: string) => {
	return str.replace(/^./, str[0].toUpperCase());
};

export const trim = (str: string) => str.replace(/^\s+|\s+$/gm, '');
