/*
使用後端代理:使用Node.js
1. npm install express axios
1. npm install cors
2. 創建server.js
3. 啟動代理伺服器 node server.js
4. 在前端程式中，將請求網址改為代理伺服器:const url = "http://localhost:3000/api/road";
*/

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

//啟用 CORS
app.use(cors());

// 代理路由
app.get('/api/road', async (req, res) => {
    try {
        const apiUrl = 'https://od.moi.gov.tw/MOI/v1/pbs';
        const response = await axios.get(apiUrl);
        res.json(response.data);// 將遠端 API 資料返回給前端
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send('Error fetching data');
    }
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`代理伺服器運行於 http://localhost:${port}`);
});
