import multer from 'multer';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { authenticateToken } from './auth.js';

// 配置 Multer 存储
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // 临时存储到 ./uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${req.user.username}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`); // 临时文件名
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 限制 10MB
});

// 文件上传接口
export const uploadFile = [authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const username = req.user.username;
        const originalFile = req.file.path;
        const zipFileName = `${username}-${Date.now()}.zip`;
        const zipFilePath = path.join(uploadDir, zipFileName);

        // 创建 ZIP 文件
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        archive.file(originalFile, { name: req.file.originalname });
        await archive.finalize();

        // 删除临时文件
        fs.unlinkSync(originalFile);

        res.json({ message: 'File uploaded and compressed successfully' });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}];