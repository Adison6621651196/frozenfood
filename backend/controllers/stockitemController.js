import pool from '../config/database.js';

// Get all stock items with product details
export const getAllStockItems = async (req, res) => {
  const sql = `
    SELECT 
      si.stockitem_id,
      si.product_id,
      si.quantity,
      si.lot_number,
      si.expiry_date,
      si.storage_location,
      si.created_at,
      p.product_name,
      p.price,
      p.product_image,
      p.category_id
    FROM StockItem si
    LEFT JOIN products p ON si.product_id = p.product_id
    ORDER BY si.stockitem_id ASC
  `;
  
  try {
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching stock items:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get stock item by ID
export const getStockItemById = async (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      si.stockitem_id,
      si.product_id,
      si.quantity,
      si.lot_number,
      si.expiry_date,
      si.storage_location,
      si.created_at,
      p.product_name,
      p.price,
      p.product_image,
      p.category_id
    FROM StockItem si
    LEFT JOIN products p ON si.product_id = p.product_id
    WHERE si.stockitem_id = ?
  `;
  
  try {
    const [results] = await pool.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching stock item:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Create new stock item
export const createStockItem = async (req, res) => {
  const { stockitem_id, product_id, quantity, lot_number, expiry_date, storage_location } = req.body;
  
  // Validate required fields
  if (!stockitem_id || !product_id || quantity === undefined || quantity === null) {
    return res.status(400).json({ 
      error: 'Required fields missing', 
      required: ['stockitem_id', 'product_id', 'quantity'] 
    });
  }

  // Validate product exists
  try {
    const [productCheck] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [product_id]);
    if (productCheck.length === 0) {
      return res.status(400).json({ error: 'Product not found', product_id });
    }
  } catch (err) {
    console.error('Error checking product:', err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }

  const sql = `
    INSERT INTO StockItem (stockitem_id, product_id, quantity, lot_number, expiry_date, storage_location, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  
  try {
    // บันทึก Stock Item ด้วยจำนวนที่ระบุ
    await pool.query(sql, [
      stockitem_id, 
      product_id, 
      quantity,
      lot_number || null, 
      expiry_date || null, 
      storage_location || null
    ]);
    
    // อัพเดทจำนวนใน products
    await pool.query(
      'UPDATE products SET quantity = ? WHERE product_id = ?',
      [quantity, product_id]
    );
    
    // อัพเดทจำนวนใน StockItem อื่นๆ ที่ใช้ product_id เดียวกัน
    await pool.query(
      'UPDATE StockItem SET quantity = ? WHERE product_id = ? AND stockitem_id != ?',
      [quantity, product_id, stockitem_id]
    );
    
    res.status(201).json({ 
      message: 'Stock item created successfully', 
      stockitem_id: stockitem_id,
      quantity: quantity
    });
  } catch (err) {
    console.error('Error creating stock item:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Stock item ID already exists', stockitem_id });
    }
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Update stock item
export const updateStockItem = async (req, res) => {
  const { id } = req.params;
  const { product_id, quantity, lot_number, expiry_date, storage_location } = req.body;
  
  try {
    // ดึงข้อมูล Stock Item เดิมก่อน
    const [stockItem] = await pool.query('SELECT product_id FROM StockItem WHERE stockitem_id = ?', [id]);
    if (stockItem.length === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    
    const oldProductId = stockItem[0].product_id;
    
    // Build dynamic update query
    let updateFields = [];
    let values = [];
    
    if (product_id !== undefined) {
      updateFields.push('product_id = ?');
      values.push(product_id);
    }
    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      values.push(quantity);
    }
    if (lot_number !== undefined) {
      updateFields.push('lot_number = ?');
      values.push(lot_number);
    }
    if (expiry_date !== undefined) {
      updateFields.push('expiry_date = ?');
      values.push(expiry_date);
    }
    if (storage_location !== undefined) {
      updateFields.push('storage_location = ?');
      values.push(storage_location);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const sql = `UPDATE StockItem SET ${updateFields.join(', ')} WHERE stockitem_id = ?`;
    
    await pool.query(sql, values);
    
    // ถ้ามีการเปลี่ยน quantity ให้อัพเดทใน products ด้วย
    if (quantity !== undefined) {
      const targetProductId = product_id || oldProductId;
      
      // อัพเดท quantity ในตาราง products
      await pool.query(
        'UPDATE products SET quantity = ? WHERE product_id = ?',
        [quantity, targetProductId]
      );
      
      // อัพเดท quantity ใน StockItem อื่นๆ ที่ใช้ product_id เดียวกัน
      await pool.query(
        'UPDATE StockItem SET quantity = ? WHERE product_id = ? AND stockitem_id != ?',
        [quantity, targetProductId, id]
      );
    }
    
    res.json({ message: 'Stock item updated successfully' });
  } catch (err) {
    console.error('Error updating stock item:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Delete stock item
export const deleteStockItem = async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM StockItem WHERE stockitem_id = ?';
  
  try {
    const [result] = await pool.query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    res.json({ message: 'Stock item deleted successfully' });
  } catch (err) {
    console.error('Error deleting stock item:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get stock items by product
export const getStockItemsByProduct = async (req, res) => {
  const { productId } = req.params;
  const sql = `
    SELECT 
      si.stockitem_id,
      si.product_id,
      si.quantity,
      si.lot_number,
      si.expiry_date,
      si.storage_location,
      si.created_at,
      p.product_name,
      p.price,
      p.product_image,
      p.category_id
    FROM StockItem si
    LEFT JOIN products p ON si.product_id = p.product_id
    WHERE si.product_id = ?
    ORDER BY si.expiry_date ASC
  `;
  
  try {
    const [results] = await pool.query(sql, [productId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching stock items by product:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get expiring stock items (within specified days)
export const getExpiringStockItems = async (req, res) => {
  const { days = 30 } = req.query;
  const sql = `
    SELECT 
      si.stockitem_id,
      si.product_id,
      si.quantity,
      si.lot_number,
      si.expiry_date,
      si.storage_location,
      si.created_at,
      p.product_name,
      p.price,
      p.product_image,
      p.category_id,
      DATEDIFF(si.expiry_date, CURDATE()) as days_until_expiry
    FROM StockItem si
    LEFT JOIN products p ON si.product_id = p.product_id
    WHERE si.expiry_date IS NOT NULL 
    AND si.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
    AND si.expiry_date >= CURDATE()
    ORDER BY si.expiry_date ASC
  `;
  
  try {
    const [results] = await pool.query(sql, [days]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching expiring stock items:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get stock summary by product
export const getStockSummaryByProduct = async (req, res) => {
  const sql = `
    SELECT 
      p.product_id,
      p.product_name,
      p.price,
      p.category_id,
      COUNT(si.stockitem_id) as total_stock_items,
      SUM(si.quantity) as total_quantity,
      MIN(si.expiry_date) as earliest_expiry,
      MAX(si.created_at) as last_stock_added
    FROM products p
    LEFT JOIN StockItem si ON p.product_id = si.product_id
    GROUP BY p.product_id, p.product_name, p.price, p.category_id
    ORDER BY p.product_name ASC
  `;
  
  try {
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching stock summary:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};
