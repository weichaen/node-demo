import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'node:fs';
import path from 'node:path';

const UPLOAD_DIR = './uploads';
const SECRET_KEY = 'test1234';

const server = createServer((req, res) => {
    if (req.url === '/login' && req.method === 'POST') {
        handleLogin(req, res);
    } else if (req.url === '/list' && req.method === 'GET') {
        handleList(req, res);
    } else if (req.url === '/upload' && req.method === 'POST') {
        handleUpload(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found\n');
    }
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
    console.log('Listening on 127.0.0.1:3000');
});

function handleLogin(req, res) {
    if (req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            console.log('Received body:', body);
            const { username, password } = JSON.parse(body);
            // need to enhance, check user and password
            const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token }));
        });

        req.on('error', err => {
            console.error('Error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error\n');
        });
    } else {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('No User\n');
    }
}

function handleList(req, res) {

}

function handleUpload(req, res) {
    // Validate token first
    const user = validateToken(req, res);
    if (!user) return;

    const ofrm = formidable({
        uploadDir: UPLOAD_DIR,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        multiples: true // Allow multiple files
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Form parse error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error processing upload\n');
            return;
        }

        // Process uploaded files
        const uploadedFiles = [];
        const fileArray = Array.isArray(files.file) ? files.file : [files.file];

        for (const file of fileArray) {
            if (file) {
                // Generate unique filename using timestamp and original name
                const timestamp = Date.now();
                const newFilename = `${timestamp}_${file.originalFilename}`;
                const newPath = path.join(UPLOAD_DIR, newFilename);

                // Rename file to include timestamp
                try {
                    fs.renameSync(file.filepath, newPath);
                    uploadedFiles.push({
                        originalName: file.originalFilename,
                        savedAs: newFilename,
                        size: file.size,
                        mimetype: file.mimetype
                    });
                } catch (renameErr) {
                    console.error('File rename error:', renameErr);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error saving file\n');
                    return;
                }
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Files uploaded successfully',
            files: uploadedFiles,
            username: user.username
        }));
    });
}


function validateToken(req, res) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Authorization header missing\n');
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        // decoder token and set user in req
        const username = jwt.verify(token, SECRET_KEY);
        req.user = username;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Token is valid', user: decoded }));
    } catch (err) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Invalid or expired token\n');
    }

}