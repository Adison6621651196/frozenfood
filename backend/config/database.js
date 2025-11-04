/**
 * Database Configuration - การตั้งค่าเชื่อมต่อฐานข้อมูล MySQL
 
 * ไฟล์นี้ใช้สำหรับ:
 * - สร้าง Connection Pool เชื่อมต่อกับ MySQL Database
 * - จัดการการเชื่อมต่อแบบ Promise-based (async/await)
 * - กำหนดค่าการเชื่อมต่อจาก environment variables (.env file)
 
 * Connection Pool คืออะไร?
 * - เป็นกลุ่มของการเชื่อมต่อ database ที่พร้อมใช้งาน
 * - ช่วยเพิ่มประสิทธิภาพ เพราะไม่ต้องสร้างการเชื่อมต่อใหม่ทุกครั้ง
 * - สามารถใช้ซ้ำได้ (reusable connections)
 
 * การใช้งาน:
 * import pool from './config/database.js';
 * const [rows] = await pool.query('SELECT * FROM users');
 */

// Import mysql2 แบบ promise เพื่อใช้ async/await
import mysql from 'mysql2/promise';
// Import dotenv เพื่ออ่านค่าจากไฟล์ .env
import dotenv from 'dotenv';

// โหลดค่า environment variables จากไฟล์ .env
dotenv.config();

/**
 * Configuration Properties:
 * @property {string} host - ที่อยู่ของ MySQL server (default: localhost)
 * @property {string} user - username สำหรับเข้าสู่ระบบ (default: root)
 * @property {string} password - รหัสผ่านสำหรับเข้าสู่ระบบ (default: '')
 * @property {string} database - ชื่อฐานข้อมูลที่ต้องการใช้งาน (default: frozen_food)
 * @property {number} port - พอร์ตของ MySQL server (default: 3306)
 * @property {boolean} waitForConnections - รอถ้าไม่มี connection ว่าง (default: true)
 * @property {number} connectionLimit - จำนวน connection สูงสุดที่สร้างได้ (default: 10)
 * @property {number} queueLimit - จำนวน request สูงสุดที่รอได้ (0 = ไม่จำกัด)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',         // เช่น localhost, 127.0.0.1
  user: process.env.DB_USER || 'root',              // username ของ MySQL
  password: process.env.DB_PASSWORD || '',          // password ของ MySQL
  database: process.env.DB_NAME || 'frozen_food',   // ชื่อ database ที่ใช้งาน
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,  // พอร์ต MySQL (default: 3306)
  
  // Pool Configuration
  waitForConnections: true,   // ถ้า connection เต็ม จะรอจนกว่าจะมีว่าง (ไม่ error ทันที)
  connectionLimit: 10,        // สร้างได้สูงสุด 10 connections พร้อมกัน
  queueLimit: 0,              // ไม่จำกัดจำนวน request ที่รออยู่ในคิว
});

export default pool;
