import express from 'express';
import { register, login, authenticateToken } from './auth.js';
import { uploadFile } from './upload.js';
import { initDb } from './db.js';

const app = express();

app.use(express.json());

// 初始化数据库
initDb().then(() => {
    console.log('Database initialized');

    // 注册路由
    app.post('/register', register);

    // 登录路由
    app.post('/login', login);

    // 上传文件路由
    app.post('/upload', uploadFile);

    // 受保护的路由示例
    app.get('/health', authenticateToken, (req, res) => {
        res.json({ message: 'Access granted to protected resource', user: req.user });
    });

    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});