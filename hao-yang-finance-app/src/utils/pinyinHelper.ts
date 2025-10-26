import { pinyin } from 'pinyin-pro';

// 注音符號順序對照表
const BOPOMOFO_ORDER = [
	'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ',
	'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ',
	'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ', 'ㄧ', 'ㄨ', 'ㄩ'
];

/**
 * 將中文字轉換為注音符號的首字母
 * @param text 中文字串
 * @returns 注音首字母，如果所有字符都無法轉換則返回 'ㄅ'（預設）
 */
export function getBopomofoInitial(text: string): string {
	if (!text || text.trim().length === 0) {
		return 'ㄅ';
	}

	const trimmedText = text.trim();

	// 拼音首字母對應注音符號的映射
	const pinyinToBopomofo: Record<string, string> = {
		'b': 'ㄅ', 'p': 'ㄆ', 'm': 'ㄇ', 'f': 'ㄈ',
		'd': 'ㄉ', 't': 'ㄊ', 'n': 'ㄋ', 'l': 'ㄌ',
		'g': 'ㄍ', 'k': 'ㄎ', 'h': 'ㄏ',
		'j': 'ㄐ', 'q': 'ㄑ', 'x': 'ㄒ',
		'zh': 'ㄓ', 'ch': 'ㄔ', 'sh': 'ㄕ', 'r': 'ㄖ',
		'z': 'ㄗ', 'c': 'ㄘ', 's': 'ㄙ',
		'y': 'ㄧ', 'w': 'ㄨ', 'yu': 'ㄩ',
		'a': 'ㄚ', 'o': 'ㄛ', 'e': 'ㄜ',
		'ai': 'ㄞ', 'ei': 'ㄟ', 'ao': 'ㄠ', 'ou': 'ㄡ',
		'an': 'ㄢ', 'en': 'ㄣ', 'ang': 'ㄤ', 'eng': 'ㄥ', 'er': 'ㄦ'
	};

	// 遍歷所有字符，跳過特殊字元，找到第一個可以轉換的中文字
	for (let i = 0; i < trimmedText.length; i++) {
		const char = trimmedText[i];

		// 嘗試轉換為注音
		const result = pinyin(char, {
			toneType: 'none',
			type: 'array',
			pattern: 'first'
		});

		if (result && result.length > 0) {
			const pinyinStr = result[0];

			// 嘗試兩個字符的組合（zh, ch, sh）
			const twoChar = pinyinStr.toLowerCase().substring(0, 2);
			if (pinyinToBopomofo[twoChar]) {
				return pinyinToBopomofo[twoChar];
			}

			// 嘗試單個字符
			const oneChar = pinyinStr.toLowerCase()[0];
			if (pinyinToBopomofo[oneChar]) {
				return pinyinToBopomofo[oneChar];
			}
		}
	}

	// 如果所有字符都無法轉換，返回預設值 'ㄅ'
	return 'ㄅ';
}

/**
 * 將項目列表按注音符號分組
 * @param items 要分組的項目列表
 * @param getNameFn 從項目中提取名稱的函數
 * @returns 按注音符號分組的對象
 */
export function groupByBopomofo<T>(
	items: T[],
	getNameFn: (item: T) => string
): Record<string, T[]> {
	const groups: Record<string, T[]> = {};

	items.forEach((item) => {
		const name = getNameFn(item);
		const initial = getBopomofoInitial(name);

		if (!groups[initial]) {
			groups[initial] = [];
		}
		groups[initial].push(item);
	});

	return groups;
}

/**
 * 取得排序後的注音符號列表（包含資料的分組）
 * @param groups 注音分組對象
 * @returns 排序後的注音符號列表
 */
export function getSortedBopomofoKeys(groups: Record<string, unknown[]>): string[] {
	const keys = Object.keys(groups);

	return keys.sort((a, b) => {
		// 按照注音符號順序排序
		const indexA = BOPOMOFO_ORDER.indexOf(a);
		const indexB = BOPOMOFO_ORDER.indexOf(b);

		return indexA - indexB;
	});
}
