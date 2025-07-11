import React, { useEffect, useMemo, useState } from 'react';

type Serializer<T> = (object: T | undefined) => string;
type Parser<T> = (val: string) => T | undefined;
type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

type Options<T> = Partial<{
	serializer: Serializer<T>;
	parser: Parser<T>;
	logger: (error: any) => void;
	syncData: boolean;
}>;

function useLocalStorage<T>(key: string, defaultValue: T, options?: Options<T>): [T, Setter<T>];
function useLocalStorage<T>(key: string, defaultValue?: T, options?: Options<T>) {
	const opts = useMemo(() => {
		return {
			serializer: JSON.stringify,
			parser: JSON.parse,
			// eslint-disable-next-line no-console
			logger: console.log,
			syncData: true,
			...options,
		};
	}, [options]);

	const { serializer, parser, logger, syncData } = opts;

	const [storedValue, setValue] = useState(() => {
		if (typeof window === 'undefined') return defaultValue;

		try {
			const item = window.localStorage.getItem(key);
			const res: T = item ? parser(item) : defaultValue;
			return res;
		} catch (e) {
			logger(e);
			return defaultValue;
		}
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const updateLocalStorage = () => {
			if (storedValue !== undefined) {
				window.localStorage.setItem(key, serializer(storedValue));
			} else {
				window.localStorage.removeItem(key);
			}
		};

		try {
			updateLocalStorage();
		} catch (e) {
			logger(e);
		}
	}, [key, logger, serializer, storedValue]);

	useEffect(() => {
		if (!syncData) return;

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key !== key || e.storageArea !== window.localStorage) return;

			try {
				setValue(e.newValue ? parser(e.newValue) : undefined);
			} catch (exception) {
				logger(exception);
			}
		};

		if (typeof window === 'undefined') return;

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [key, logger, parser, syncData]);

	return [storedValue, setValue];
}

export default useLocalStorage;
