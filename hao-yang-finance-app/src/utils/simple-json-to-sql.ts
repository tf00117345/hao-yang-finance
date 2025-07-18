export function jsonToSqlInsert(data, tableName = 'company') {
	const companyInserts: string[] = [];
	const phoneInserts: string[] = [];

	data.forEach((item) => {
		// 生成 company 插入語句
		const companyColumns = [
			'id',
			'name',
			'tax_id',
			'contact_person',
			'address',
			'email',
			'is_active',
			'created_at',
			'updated_at',
		];
		const companyValues = [
			`'${item.id}'`,
			`'${item.name ? item.name.replace(/'/g, "''") : ''}'`,
			item.taxId ? `'${item.taxId}'` : 'NULL',
			item.contactPerson ? `'${item.contactPerson.replace(/'/g, "''")}'` : 'NULL',
			item.address ? `'${item.address.replace(/'/g, "''")}'` : 'NULL',
			item.email ? `'${item.email}'` : 'NULL',
			'1', // is_active
			`'${new Date().toISOString()}'`, // created_at
			`'${new Date().toISOString()}'`, // updated_at
		];

		companyInserts.push(
			`INSERT INTO ${tableName} (${companyColumns.join(', ')}) VALUES (${companyValues.join(', ')});`,
		);

		// 生成 phone 插入語句
		if (item.phone && Array.isArray(item.phone)) {
			item.phone.forEach((phoneNumber) => {
				const phoneColumns = ['id', 'company_id', 'phone_number', 'created_at'];
				const phoneValues = [
					`'${generateUUID()}'`,
					`'${item.id}'`,
					`'${phoneNumber.replace(/'/g, "''")}'`,
					`'${new Date().toISOString()}'`,
				];

				phoneInserts.push(
					`INSERT INTO ${tableName}_phone (${phoneColumns.join(', ')}) VALUES (${phoneValues.join(', ')});`,
				);
			});
		}
	});

	return {
		companyInserts,
		phoneInserts,
		combinedSQL: [
			'-- 公司資料插入語句',
			`-- 生成時間: ${new Date().toISOString()}`,
			'',
			'-- 插入公司資料',
			...companyInserts,
			'',
			'-- 插入電話號碼資料',
			...phoneInserts,
			'',
		].join('\n'),
	};
}

// 簡單的 UUID 生成器
export function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
