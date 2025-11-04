import db from '../config/database.js';
import logger from '../utils/logger.js';

// Helper Function: แปลง path ให้เป็น relative ("image/xxx")
// ใช้สำหรับจัดการ path ของรูปภาพให้เป็นรูปแบบเดียวกัน
const toRelativeImagePath = (p) => {
  if (!p) return null;
  // แทน \ เป็น / และตัดส่วนก่อนหน้า "image/"
  const norm = String(p).replace(/\\/g, '/');
  const i = norm.toLowerCase().lastIndexOf('/image/');
  if (i !== -1) return norm.slice(i + 1); // เอาตั้งแต่หลัง "/" ตัวก่อนหน้า image => "image/xxx"
  // ถ้าไม่ได้อยู่ในโฟลเดอร์ image แต่ส่งมาเป็นชื่อไฟล์ล้วน ก็ prefix ให้
  if (!norm.startsWith('image/')) return `image/${norm}`;
  return norm;
};

// ดึงสินค้าทั้งหมด
// GET /api/products
// Response: Array ของสินค้าทั้งหมดในระบบ
export const getAllProducts = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM products');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// ดึงสินค้าตามรหัส product_id
// GET /api/products/:id
// Response: ข้อมูลสินค้าชิ้นเดียว
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('SELECT * FROM products WHERE product_id = ?', [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// สร้างสินค้าใหม่
// POST /api/products
// Body: { product_id, product_name, category_id, price, quantity, product_image }
// product_image จะถูกแปลงเป็น relative path ด้วยฟังก์ชัน toRelativeImagePath
export const createProduct = async (req, res) => {
  try {
    const { product_id, product_name, category_id, price, quantity, product_image } = req.body;
    const relPath = toRelativeImagePath(product_image);

    const [result] = await db.query(
      'INSERT INTO products (product_id, product_name, category_id, price, quantity, product_image) VALUES (?, ?, ?, ?, ?, ?)',
      [product_id, product_name, category_id, price, quantity, relPath]
    );
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// แก้ไขสินค้า
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category_id, price, quantity, product_image } = req.body;
    const relPath = toRelativeImagePath(product_image);

    await db.query(
      'UPDATE products SET product_name = ?, category_id = ?, price = ?, quantity = ?, product_image = ? WHERE product_id = ?',
      [product_name, category_id, price, quantity, relPath, id]
    );
    
    // อัพเดทจำนวนใน StockItem ที่เกี่ยวข้องด้วย
    if (quantity !== undefined) {
      await db.query(
        'UPDATE StockItem SET quantity = ? WHERE product_id = ?',
        [quantity, id]
      );
    }
    
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// ลบสินค้า
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ตรวจสอบว่ามี Order Items ที่ใช้สินค้านี้หรือไม่
    const [orderItems] = await db.query(
      'SELECT COUNT(*) as count FROM orderitems WHERE product_id = ?', 
      [id]
    );
    
    if (orderItems[0].count > 0) {
      return res.status(400).json({ 
        error: `ไม่สามารถลบได้ มีออเดอร์ ${orderItems[0].count} รายการที่ใช้สินค้านี้อยู่`,
        orderItemsCount: orderItems[0].count 
      });
    }
    
    // ตรวจสอบว่ามี Stock Items ที่อ้างอิงถึงสินค้านี้หรือไม่
    const [stockItems] = await db.query(
      'SELECT COUNT(*) as count FROM StockItem WHERE product_id = ?', 
      [id]
    );
    
    if (stockItems[0].count > 0) {
      return res.status(400).json({ 
        error: `ไม่สามารถลบได้ มี Stock Items ${stockItems[0].count} รายการที่อ้างอิงถึงสินค้านี้`,
        stockItemsCount: stockItems[0].count 
      });
    }
    
    // ถ้าไม่มีข้อมูลที่อ้างอิง ให้ลบได้
    await db.query('DELETE FROM products WHERE product_id = ?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    logger.error('Error deleting product:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า', details: err.message });
  }
};

// ลดจำนวนสินค้า (เมื่อมีการสั่งซื้อ)
export const decreaseProductQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    
    // ตรวจสอบจำนวนสินค้าปัจจุบัน
    const [results] = await db.query('SELECT quantity FROM products WHERE product_id = ?', [product_id]);
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
    
    const currentQuantity = results[0].quantity;
    if (currentQuantity < quantity) {
      return res.status(400).json({ message: 'สินค้าไม่เพียงพอ', currentQuantity });
    }
    
    const newQuantity = currentQuantity - quantity;
    
    // ลดจำนวนสินค้า
    await db.query(
      'UPDATE products SET quantity = quantity - ? WHERE product_id = ?',
      [quantity, product_id]
    );
    
    // อัพเดทจำนวนใน StockItem ที่เกี่ยวข้องด้วย
    await db.query(
      'UPDATE StockItem SET quantity = ? WHERE product_id = ?',
      [newQuantity, product_id]
    );
    
    res.json({ message: 'Product quantity decreased', newQuantity });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// เพิ่มจำนวนสินค้าคืน (เมื่อยกเลิกออเดอร์)
export const increaseProductQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    
    // เพิ่มจำนวนสินค้า
    await db.query(
      'UPDATE products SET quantity = quantity + ? WHERE product_id = ?',
      [quantity, product_id]
    );
    
    // ดึงจำนวนใหม่
    const [results] = await db.query('SELECT quantity FROM products WHERE product_id = ?', [product_id]);
    const newQuantity = results[0].quantity;
    
    // อัพเดทจำนวนใน StockItem ที่เกี่ยวข้องด้วย
    await db.query(
      'UPDATE StockItem SET quantity = ? WHERE product_id = ?',
      [newQuantity, product_id]
    );
    
    res.json({ message: 'Product quantity increased' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// อัปเดตจำนวนสินค้าหลายรายการพร้อมกัน (ใช้ Promise-based)
export const updateMultipleProductQuantities = async (products, increase = false) => {
  if (!products || products.length === 0) {
    return { success: true };
  }

  try {
    const sql = increase 
      ? 'UPDATE products SET quantity = quantity + ? WHERE product_id = ?'
      : 'UPDATE products SET quantity = quantity - ? WHERE product_id = ?';
    
    // ใช้ Promise.all เพื่ออัปเดตทั้งหมดพร้อมกัน
    await Promise.all(
      products.map(item => 
        db.query(sql, [item.quantity, item.product_id])
      )
    );
    
    // อัพเดท StockItem ทุกรายการที่เกี่ยวข้อง
    for (const item of products) {
      const [results] = await db.query('SELECT quantity FROM products WHERE product_id = ?', [item.product_id]);
      if (results.length > 0) {
        await db.query(
          'UPDATE StockItem SET quantity = ? WHERE product_id = ?',
          [results[0].quantity, item.product_id]
        );
      }
    }
    
    return { success: true };
  } catch (err) {
    logger.error('Error updating multiple products:', err);
    throw err;
  }
};

