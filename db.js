import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';

const dbPath = process.env.SQLITE_DB_PATH || ':memory:';

let dbInstance = null;

// 初始化数据库（仅用于确保表存在）
export async function initDb() {
    const db = await getDb(); // 使用 getDb 获取单例
    try {
        await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
        console.log('Users table created');
    } catch (err) {
        console.error('Failed to initialize database:', err.message);
        throw err;
    }
    // 不关闭连接，保持单例
}

// 获取数据库连接（单例模式）
export async function getDb() {
    if (dbInstance) return dbInstance;
    try {
        dbInstance = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log('Database initialized');
        return dbInstance;
    } catch (err) {
        console.error('Failed to open database:', err.message);
        throw err;
    }
}

// 关闭数据库连接（仅在服务器关闭时调用）
export async function closeDb() {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
        console.log('Database connection closed');
    }
}

// 清空用户表（测试用）
export async function clearUsers() {
    const db = await getDb();
    try {
        await db.exec('DELETE FROM users');
        console.log('Users table cleared');
    } catch (err) {
        console.error('Failed to clear users:', err.message);
        throw err;
    }
    // 不关闭连接
}

// 插入用户
export async function insertUser(username, password) {
    const db = await getDb();
    try {
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    } catch (err) {
        console.error('Failed to insert user:', err.message);
        throw err;
    }
    // 不关闭连接
}

// 查找用户
export async function findUserByUsername(username) {
    const db = await getDb();
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        return user || null;
    } catch (err) {
        console.error('Failed to find user:', err.message);
        throw err;
    }
    // 不关闭连接
}