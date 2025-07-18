const https = require('https');

// 忽略自簽名憑證錯誤
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const BASE_URL = 'https://localhost:7201';

async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7201,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : null;
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testWaybillAPI() {
    console.log('🧪 開始測試 Waybill API');
    console.log('================================');

    try {
        // 1. 測試獲取公司列表
        console.log('1. 測試獲取公司列表...');
        const companiesResponse = await makeRequest('GET', '/api/company');
        console.log('✅ 公司列表:', companiesResponse.statusCode, companiesResponse.data?.length || 0, '筆');

        // 2. 測試獲取司機列表
        console.log('\n2. 測試獲取司機列表...');
        const driversResponse = await makeRequest('GET', '/api/driver');
        console.log('✅ 司機列表:', driversResponse.statusCode, driversResponse.data?.length || 0, '筆');

        // 3. 測試獲取託運單列表
        console.log('\n3. 測試獲取託運單列表...');
        const waybillsResponse = await makeRequest('GET', '/api/waybill?startDate=2024-01-01&endDate=2024-12-31');
        console.log('✅ 託運單列表:', waybillsResponse.statusCode, waybillsResponse.data?.length || 0, '筆');

        // 4. 測試新增託運單
        if (companiesResponse.data && companiesResponse.data.length > 0 && 
            driversResponse.data && driversResponse.data.length > 0) {
            
            console.log('\n4. 測試新增託運單...');
            const company = companiesResponse.data[0];
            const driver = driversResponse.data[0];
            
            const newWaybill = {
                waybillNumber: 'TEST-' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                item: '測試貨物',
                tonnage: 10.5,
                companyId: company.id,
                workingTimeStart: '08:00',
                workingTimeEnd: '17:00',
                fee: 5000,
                driverId: driver.id,
                plateNumber: 'ABC-1234',
                notes: '測試託運單',
                loadingLocations: [
                    { from: '車廠', to: '目的地A' },
                    { from: '目的地A', to: '目的地B' }
                ],
                extraExpenses: [
                    { item: '過路費', fee: 100, notes: '高速公路' },
                    { item: '停車費', fee: 50, notes: '目的地停車' }
                ]
            };

            const createResponse = await makeRequest('POST', '/api/waybill', newWaybill);
            console.log('✅ 新增託運單:', createResponse.statusCode);
            
            if (createResponse.statusCode === 201) {
                const createdWaybill = createResponse.data.data || createResponse.data;
                console.log('📄 託運單ID:', createdWaybill.id);
                console.log('📄 託運單號碼:', createdWaybill.waybillNumber);

                // 5. 測試更新託運單
                console.log('\n5. 測試更新託運單...');
                const updateData = {
                    ...newWaybill,
                    notes: '更新後的託運單',
                    fee: 5500
                };

                const updateResponse = await makeRequest('PUT', `/api/waybill/${createdWaybill.id}`, updateData);
                console.log('✅ 更新託運單:', updateResponse.statusCode);

                // 6. 測試狀態管理
                console.log('\n6. 測試狀態管理...');
                const markResponse = await makeRequest('PUT', `/api/waybill/${createdWaybill.id}/no-invoice`);
                console.log('✅ 標記為不需開發票:', markResponse.statusCode);

                const restoreResponse = await makeRequest('PUT', `/api/waybill/${createdWaybill.id}/restore`);
                console.log('✅ 還原狀態:', restoreResponse.statusCode);

                // 7. 測試刪除託運單
                console.log('\n7. 測試刪除託運單...');
                const deleteResponse = await makeRequest('DELETE', `/api/waybill/${createdWaybill.id}`);
                console.log('✅ 刪除託運單:', deleteResponse.statusCode);
            }
        }

        console.log('\n🎉 測試完成！');
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 執行測試
testWaybillAPI();