const https = require('https');

// 忽略自簽名憑證錯誤
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
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : null;
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData,
                        rawData: responseData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: null,
                        rawData: responseData
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

async function debugAPI() {
    console.log('🔍 Debug Waybill API');
    console.log('====================');

    try {
        // 測試獲取託運單列表
        console.log('1. 測試獲取託運單列表...');
        const response = await makeRequest('GET', '/api/waybill?startDate=2024-01-01&endDate=2024-12-31');
        console.log('Status:', response.statusCode);
        console.log('Response:', response.rawData);

        if (response.statusCode === 500) {
            console.log('\n❌ 發生錯誤，檢查伺服器日誌');
        }
        
    } catch (error) {
        console.error('❌ 請求失敗:', error.message);
    }
}

debugAPI();