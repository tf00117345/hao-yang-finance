const https = require('https');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function quickTest() {
    const options = {
        hostname: 'localhost',
        port: 7201,
        path: '/api/company',
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
        console.log(`狀態: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log(`回應長度: ${data.length}`));
    });

    req.on('error', (err) => {
        console.log('錯誤:', err.message);
    });

    req.end();
}

quickTest();