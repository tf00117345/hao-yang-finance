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

async function testInvoiceAPI() {
    console.log('🧪 開始測試 Invoice API');
    console.log('================================');

    try {
        // 1. 測試獲取公司列表（用於建立發票）
        console.log('1. 測試獲取公司列表...');
        const companiesResponse = await makeRequest('GET', '/api/company');
        console.log(`✅ 公司列表: ${companiesResponse.statusCode} ${companiesResponse.data?.length || 0} 筆`);

        // 2. 測試獲取司機列表
        console.log('2. 測試獲取司機列表...');
        const driversResponse = await makeRequest('GET', '/api/driver');
        console.log(`✅ 司機列表: ${driversResponse.statusCode} ${driversResponse.data?.length || 0} 筆`);

        // 3. 測試獲取託運單列表（PENDING 狀態）
        console.log('3. 測試獲取託運單列表...');
        const waybillsResponse = await makeRequest('GET', '/api/waybill?startDate=2024-01-01&endDate=2024-12-31');
        console.log(`✅ 託運單列表: ${waybillsResponse.statusCode} ${waybillsResponse.data?.length || 0} 筆`);

        // 4. 測試獲取發票列表（初始應為空）
        console.log('4. 測試獲取發票列表...');
        const invoicesResponse = await makeRequest('GET', '/api/invoice');
        console.log(`✅ 發票列表: ${invoicesResponse.statusCode} ${invoicesResponse.data?.length || 0} 筆`);

        // 5. 測試發票統計
        console.log('5. 測試發票統計...');
        const statsResponse = await makeRequest('GET', '/api/invoice/stats');
        console.log(`✅ 發票統計: ${statsResponse.statusCode}`);
        if (statsResponse.statusCode === 200) {
            console.log(`   總發票數: ${statsResponse.data.totalInvoices}`);
            console.log(`   已收款: ${statsResponse.data.paidInvoices}`);
            console.log(`   未收款: ${statsResponse.data.unpaidInvoices}`);
        }

        // 6. 如果有資料，測試建立發票
        if (companiesResponse.statusCode === 200 && companiesResponse.data?.length > 0 &&
            waybillsResponse.statusCode === 200 && waybillsResponse.data?.length > 0) {
            
            console.log('6. 測試建立發票...');
            
            // 找到第一個公司和第一個 PENDING 狀態的託運單
            const company = companiesResponse.data[0];
            const pendingWaybills = waybillsResponse.data.filter(w => w.status === 'PENDING');
            
            if (pendingWaybills.length > 0) {
                const waybill = pendingWaybills[0];
                
                const newInvoice = {
                    invoiceNumber: 'TEST-INV-' + Date.now(),
                    date: '2024-07-19',
                    companyId: company.id,
                    taxRate: 0.05,
                    extraExpensesIncludeTax: false,
                    notes: '測試發票',
                    waybillIds: [waybill.id],
                    extraExpenseIds: []
                };
                
                const createResponse = await makeRequest('POST', '/api/invoice', newInvoice);
                console.log(`✅ 建立發票: ${createResponse.statusCode}`);
                
                if (createResponse.statusCode === 201) {
                    const invoiceId = createResponse.data.id;
                    console.log(`   發票ID: ${invoiceId}`);
                    console.log(`   發票號碼: ${createResponse.data.invoiceNumber}`);
                    console.log(`   總金額: ${createResponse.data.total}`);
                    
                    // 7. 測試標記已收款
                    console.log('7. 測試標記已收款...');
                    const markPaidData = {
                        paymentMethod: '現金',
                        paymentNote: '測試收款'
                    };
                    
                    const markPaidResponse = await makeRequest('POST', `/api/invoice/${invoiceId}/mark-paid`, markPaidData);
                    console.log(`✅ 標記已收款: ${markPaidResponse.statusCode}`);
                    
                    // 8. 測試作廢發票
                    console.log('8. 測試作廢發票...');
                    const voidResponse = await makeRequest('POST', `/api/invoice/${invoiceId}/void`);
                    console.log(`✅ 作廢發票: ${voidResponse.statusCode}`);
                    
                    // 9. 測試刪除發票（因為已作廢，應該會失敗）
                    console.log('9. 測試刪除已作廢發票（應該失敗）...');
                    const deleteResponse = await makeRequest('DELETE', `/api/invoice/${invoiceId}`);
                    console.log(`✅ 刪除發票: ${deleteResponse.statusCode} - ${deleteResponse.statusCode === 400 ? '正確阻止' : '意外成功'}`);
                    
                } else {
                    console.log(`❌ 建立發票失敗: ${createResponse.rawData}`);
                }
            } else {
                console.log('⚠️  沒有 PENDING 狀態的託運單可用於測試');
            }
        } else {
            console.log('⚠️  缺少測試資料（公司或託運單）');
        }

        console.log('\n🎉 Invoice API 測試完成！');
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

testInvoiceAPI();