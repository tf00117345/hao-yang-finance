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
                    resolve({ statusCode: res.statusCode, data: parsedData });
                } catch (error) {
                    resolve({ statusCode: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => reject(error));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testBasicEndpoints() {
    console.log('🧪 測試基本端點');
    
    try {
        console.log('1. 測試公司列表...');
        const companies = await makeRequest('GET', '/api/company');
        console.log('✅ 公司:', companies.statusCode, companies.data?.length || 0);
        
        console.log('2. 測試司機列表...');
        const drivers = await makeRequest('GET', '/api/driver');
        console.log('✅ 司機:', drivers.statusCode, drivers.data?.length || 0);
        
        console.log('3. 測試託運單列表 (無日期篩選)...');
        const waybills = await makeRequest('GET', '/api/waybill');
        console.log('✅ 託運單:', waybills.statusCode, waybills.data?.length || 0);
        
        if (waybills.statusCode === 200) {
            console.log('🎉 API 基本功能正常！');
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

testBasicEndpoints();