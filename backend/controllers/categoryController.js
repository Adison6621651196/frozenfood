// ไลบรารีเชื่อมต่อฐานข้อมูล MySQL
import mysql from 'mysql2';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

// เชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'frozen_food',
});

// ดึงหมวดหมู่ทั้งหมด
// GET /api/categories
export const getAllCategories = (req, res) => {
  db.query('SELECT * FROM Categories', (err, results) => {
    if (err) {
      logger.error('Error fetching categories:', err);
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
};

// ดึงหมวดหมู่ตาม ID
// GET /api/categories/:id
export const getCategoryById = (req, res) => {
  
  const { id } = req.params;
  db.query('SELECT * FROM Categories WHERE category_id = ?', [id], (err, results) => {
    if (err) {
      logger.error('Error fetching category by id:', err);
      return res.status(500).json({ error: err });
    }
    if (results.length === 0) return res.status(404).json({ message: "Category not found" });
    res.json(results[0]);
  });
};

// สร้างหมวดหมู่ใหม่
// POST /api/categories
// Body: { category_id, category_name }
export const createCategory = (req, res) => {
  const { category_id, category_name } = req.body;
  db.query(
    'INSERT INTO Categories (category_id, category_name) VALUES (?, ?)',
    [category_id, category_name],
    (err) => {
      if (err) {
        logger.error('Error creating category:', err);
        return res.status(500).json({ error: err });
      }
      res.status(201).json({ message: 'Category created' });
    }
  );
};

// แก้ไขหมวดหมู่
// PUT /api/categories/:id
// Body: { category_name }
export const updateCategory = (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  db.query(
    'UPDATE Categories SET category_name=? WHERE category_id=?',
    [category_name, id],
    (err) => {
      if (err) {
        logger.error('Error updating category:', err);
        return res.status(500).json({ error: err });
      }
      res.json({ message: 'Category updated' });
    }
  );
};

// ลบหมวดหมู่
// DELETE /api/categories/:id
export const deleteCategory = (req, res) => {
  const { id } = req.params;
  
  // ตรวจสอบว่ามีสินค้าที่ใช้หมวดหมู่นี้อยู่หรือไม่
  db.query('SELECT COUNT(*) as count FROM Products WHERE category_id = ?', [id], (err, results) => {
    if (err) {
      logger.error('Error checking category usage:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }
    
    const count = results[0].count;
    if (count > 0) {
      return res.status(400).json({ 
        error: `ไม่สามารถลบได้ มีสินค้า ${count} รายการที่ใช้หมวดหมู่นี้อยู่`,
        productsCount: count 
      });
    }
    
    // ถ้าไม่มีสินค้าใช้หมวดหมู่นี้ ให้ลบได้
    db.query('DELETE FROM Categories WHERE category_id=?', [id], (err) => {
      if (err) {
        logger.error('Error deleting category:', err);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
      }
      res.json({ message: 'Category deleted' });
    });
  });
};
