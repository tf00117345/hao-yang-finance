module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	plugins: ['react-refresh', '@tanstack/query', 'prettier'],
	extends: [
		'airbnb',
		'airbnb-typescript',
		'airbnb/hooks',
		'plugin:react/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
		'plugin:import/recommended',
		'plugin:jsx-a11y/recommended',
		'plugin:@tanstack/eslint-plugin-query/recommended',
		'plugin:prettier/recommended',
	],
	// 新增
	settings: {
		react: {
			version: 'detect',
		},
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
			},
			node: {
				paths: ['src', 'public'],
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
			},
		},
	},
	ignorePatterns: ['.eslintrc.cjs', 'eslint.config.js', 'vite.config.ts'],
	overrides: [],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: { jsx: true },
		ecmaVersion: 'latest',
		sourceType: 'module',
		project: './tsconfig.app.json',
	},
	rules: {
		'@tanstack/query/exhaustive-deps': 'warn',
		'@tanstack/query/no-deprecated-options': 'warn',
		'@tanstack/query/prefer-query-object-syntax': 'warn',
		'@tanstack/query/stable-query-client': 'warn',
		'react/react-in-jsx-scope': 0,
		//
		'import/order': [
			'error',
			{
				groups: ['builtin', 'external', 'internal'],
				pathGroups: [
					{
						pattern: 'react+(|-dom)',
						group: 'external',
						position: 'before',
					},
				],
				pathGroupsExcludedImportTypes: ['react'],
				'newlines-between': 'always',
				alphabetize: {
					order: 'asc',
					caseInsensitive: true,
				},
			},
		],
		'import/prefer-default-export': 0,
		'no-console': ['error', { allow: ['warn', 'error'] }],
		'linebreak-style': 'off',
		'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
		'prettier/prettier': ['error', { endOfLine: 'auto' }],
		'no-plusplus': 'off',
		'consistent-return': 'off',
		'react/require-default-props': 0,
		'react/no-unused-prop-types': 'warn',

		'react/prop-types': 0,
		'react/destructuring-assignment': 0,
		'react/static-property-placement': 0,
		'react/jsx-props-no-spreading': 0,
		'react/jsx-no-useless-fragment': 0,
		'@typescript-eslint/no-use-before-define': 0,
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-shadow': 'warn',
		'jsx-a11y/click-events-have-key-events': 0,
		'jsx-a11y/no-static-element-interactions': 0,
		'jsx-a11y/alt-text': 0,
		'jsx-a11y/no-noninteractive-element-interactions': 'off',
		'jsx-a11y/label-has-associated-control': 'off',
		'no-restricted-syntax': ['error'],
		'no-return-assign': 0,
		'lines-between-class-members': 'off',
		'@typescript-eslint/lines-between-class-members': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'error',
		'import/extensions': 'off',
		// "import/no-absolute-path": "off",
		// "import/no-unresolved": "off"
	},
};
