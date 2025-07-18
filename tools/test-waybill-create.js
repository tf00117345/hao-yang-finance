const https = require('https');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

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
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : null;
                    resolve({ statusCode: res.statusCode, data: parsedData, rawData: responseData });
                } catch (error) {
                    resolve({ statusCode: res.statusCode, data: null, rawData: responseData });
                }
            });
        });

        req.on('error', (error) => reject(error));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testWaybillCreate() {
    console.log('🧪 測試託運單建立');
    
    try {
        // 先獲取公司和司機
        const companies = await makeRequest('GET', '/api/company');
        const drivers = await makeRequest('GET', '/api/driver');
        
        if (companies.statusCode === 200 && drivers.statusCode === 200 && 
            companies.data?.length > 0 && drivers.data?.length > 0) {
            
            const company = companies.data[0];
            const driver = drivers.data[0];
            
            const newWaybill = {
                waybillNumber: 'TEST-' + Date.now(),
                date: '2024-07-18',
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
            
            console.log('建立託運單...');
            const result = await makeRequest('POST', '/api/waybill', newWaybill);
            console.log('Status:', result.statusCode);
            if (result.statusCode === 201) {
                console.log('✅ 託運單建立成功');
                console.log('ID:', result.data.data?.id || result.data.id);
            } else {
                console.log('❌ 建立失敗:', result.rawData);
            }
        } else {
            console.log('❌ 無法獲取公司或司機資料');
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
        console.error('Stack:', error.stack);
    }
}

testWaybillCreate();