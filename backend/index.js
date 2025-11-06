/**
 * ไฟล์นี้เป็นไฟล์หลักในการเริ่มต้น Express Server
 * มีหน้าที่:
 * 1. ตั้งค่า Express Application
 * 2. กำหนด CORS Policy สำหรับการเชื่อมต่อกับ Frontend
 * 3. ตั้งค่า Middleware สำหรับ JSON parsing และ logging
 * 4. เปิดให้เข้าถึงไฟล์ static (รูปภาพสินค้า, หลักฐานการชำระเงิน)
 * 5. เชื่อมต่อ API Routes
 * 6. เริ่มต้น Server บน Port ที่กำหนด
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/api.js';
import logger from './utils/logger.js';

// โหลดค่า Environment Variables จากไฟล์ .env
dotenv.config();
const app = express();

// ============================================
// CORS Configuration
// ============================================
// อนุญาตให้ Frontend (Angular) เรียกใช้ API ได้ทั้ง localhost และ production
const allowedOrigins = [
  'http://localhost:4200',
  'https://localhost:4200',
  process.env.FRONTEND_URL,
  'https://frozenfood-flame.vercel.app' // เพิ่ม Vercel URL
].filter(Boolean); // กรองค่า undefined/null ออก

app.use(cors({ 
  origin: function (origin, callback) {
    // อนุญาต requests ที่ไม่มี origin (เช่น Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Log เพื่อ debug
    logger.info(`CORS request from origin: ${origin}`);
    
    // ตรวจสอบว่า origin อยู่ใน allowedOrigins หรือไม่
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.error(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// Middleware Configuration
// ============================================
// express.json() = อนุญาตให้ Express รับข้อมูล JSON จาก request body
app.use(express.json());

// Middleware สำหรับ logging requests
// บันทึกทุก HTTP request ที่เข้ามา (GET, POST, PUT, DELETE, etc.)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// Static Files Configuration
// ============================================
// เปิดให้เข้าถึงไฟล์ในโฟลเดอร์ backend/image แบบ public
// เช่น: http://localhost:3000/image/06.avif
app.use('/image', express.static('image'));

// เปิดให้เข้าถึงไฟล์ uploads (หลักฐานการชำระเงิน)
// เช่น: http://localhost:3000/uploads/payment-proofs/xxx.jpg
app.use('/uploads', express.static('uploads'));

// ============================================
// Health Check Endpoint (สำหรับ Cron Job ping)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is running' 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'FreezeFood API Server',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// ============================================
// API Routes
// ============================================
// เชื่อมต่อทุก API endpoints ที่อยู่ในไฟล์ routes/api.js
// ทุก route จะเริ่มต้นด้วย /api เช่น /api/products, /api/orders
app.use('/api', productRoutes);

// ============================================
// Start Server
// ============================================
// อ่านค่า PORT จาก Environment Variable หรือใช้ 3001 เป็นค่า default
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Backend is running at http://localhost:${PORT}`);
  logger.info(`API endpoints available at http://localhost:${PORT}/api`);
});
