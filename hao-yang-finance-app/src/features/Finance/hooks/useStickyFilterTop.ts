import { useEffect, useRef, useState } from 'react';

/**
 * useStickyFilterTop
 *
 * 動態量測 TableHead 與篩選列的高度，計算 sticky filter row 的 top 偏移，
 * 以避免將 top 寫死，確保不同密度、字體與多行表頭時仍正確貼齊。
 */
export function useStickyFilterTop() {
	const tableHeadRef = useRef<HTMLTableSectionElement | null>(null);
	const filterRowRef = useRef<HTMLTableRowElement | null>(null);
	const [filterTop, setFilterTop] = useState(0);

	useEffect(() => {
		function updateFilterTop() {
			const head = tableHeadRef.current;
			const filterRow = filterRowRef.current;
			if (!head || !filterRow) return;
			const totalHeadHeight = head.getBoundingClientRect().height;
			const filterRowHeight = filterRow.getBoundingClientRect().height;
			// 偏移量 = 表頭總高度 - 篩選列高度
			const offset = Math.max(0, Math.round(totalHeadHeight - filterRowHeight));
			setFilterTop(offset);
		}

		updateFilterTop();

		const ro = new ResizeObserver(() => updateFilterTop());
		if (tableHeadRef.current) ro.observe(tableHeadRef.current);
		if (filterRowRef.current) ro.observe(filterRowRef.current);
		window.addEventListener('resize', updateFilterTop);

		return () => {
			ro.disconnect();
			window.removeEventListener('resize', updateFilterTop);
		};
	}, []);

	return { tableHeadRef, filterRowRef, filterTop } as const;
}
