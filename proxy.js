import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001; // 本地代理运行在 3001 端口

// 允许跨域
app.use(cors());
app.use(express.json());

// 核心中转接口
app.get('/fetch', async (req, res) => {
    const { url, cookie } = req.query;

    if (!url) {
        return res.status(400).send('Missing URL');
    }

    console.log(`[Proxy] Requesting: ${url}`);
    
    try {
        const response = await axios.get(url, {
            headers: {
                // 模拟真实的浏览器 Header，非常重要！
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // 核心：带上用户传来的 Cookie
                'Cookie': cookie || '',
                'Referer': 'https://www.douban.com/',
                'Host': 'movie.douban.com'
            },
            // 防止 axios 自动抛出重定向错误
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 400; // 只要不是4xx/5xx都算成功
            },
        });

        res.send(response.data);
    } catch (error) {
        console.error(`[Proxy Error] ${error.message}`);
        // 豆瓣经常返回 403 (IP被封) 或 418 (茶壶)
        if (error.response) {
            res.status(error.response.status).send(error.response.data || 'Proxy Error');
        } else {
            res.status(500).send('Network Error');
        }
    }
});

app.listen(PORT, () => {
    console.log(`✅ 本地中转服务已启动: http://localhost:${PORT}`);
    console.log(`💡 在 React 前端使用 Cookie 模式时，流量将通过此服务转发。`);
});