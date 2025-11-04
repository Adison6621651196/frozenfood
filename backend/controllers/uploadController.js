// ไลบรารีสำหรับจัดการการอัปโหลดไฟล์ใน Node.js
import multer from 'multer';
// โมดูลสำหรับจัดการเส้นทางไฟล์และระบบไฟล์
import path from 'path';
// โมดูลสำหรับจัดการระบบไฟล์
import fs from 'fs';
// Logger สำหรับบันทึกเหตุการณ์ต่างๆ
import logger from '../utils/logger.js';

// กำหนดตำแหน่งและชื่อไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/payment-proofs/';
    
    // สร้างโฟลเดอร์ถ้าไม่มี
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ใหม่ด้วย timestamp
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// กรองประเภทไฟล์
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only image files'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาด 5MB
  }
});

// ฟังก์ชันอัปโหลดไฟล์
export const uploadPaymentProof = (req, res) => {
  upload.single('payment_proof')(req, res, (err) => {
    if (err) {
      logger.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  });
};

// Storage สำหรับรูปสินค้า
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'image/';
    
    // สร้างโฟลเดอร์ถ้าไม่มี
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // ใช้ชื่อไฟล์เดิม
    cb(null, file.originalname);
  }
});

const productImageUpload = multer({
  storage: productImageStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาด 5MB
  }
});

// ฟังก์ชันอัปโหลดรูปสินค้า
export const uploadProductImage = (req, res) => {
  productImageUpload.single('image')(req, res, (err) => {
    if (err) {
      logger.error('Product image upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('Product image uploaded:', req.file.filename);
    
    res.json({
      success: true,
      message: 'Product image uploaded successfully',
      filePath: 'image/' + req.file.filename,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  });
};