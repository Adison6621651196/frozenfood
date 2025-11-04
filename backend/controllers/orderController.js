import db from '../config/database.js';
import logger from '../utils/logger.js';
import { updateMultipleProductQuantities } from './productController.js';

// ดึงออร์เดอร์ทั้งหมด + username และ phone ของ user
export const getAllOrders = async (req, res) => {
  try {
    logger.info('Getting all orders...');
    const sql = `
      SELECT o.*, 
             u.username, 
             u.email,
             u.address as user_address,
             u.phone as user_phone,
             COALESCE(o.phone, u.phone) as final_phone,
             COALESCE(o.delivery_address, u.address) as final_delivery_address
      FROM Orders o
      JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
    `;
    const [results] = await db.query(sql);
    logger.info(`Found ${results.length} orders`);
    res.json(results);
  } catch (err) {
    logger.error('Error getting all orders:', err.message, err.stack);
    res.status(500).json({ error: err.message, details: err.toString() });
  }
};

// ดึงออร์เดอร์ตาม id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Getting order by ID: ${id}`);
    
    const sql = `
      SELECT o.*, 
             u.username, 
             u.email,
             u.address as user_address,
             u.phone as user_phone,
             COALESCE(o.phone, u.phone) as final_phone,
             COALESCE(o.delivery_address, u.address) as final_delivery_address
      FROM Orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `;
    const [results] = await db.query(sql, [id]);
    logger.info(`Query result: ${results.length} order(s) found`);
    
    if (results.length === 0) {
      logger.warn(`Order not found: ${id}`);
      return res.status(404).json({ message: "Order not found", orderId: id });
    }
    res.json(results[0]);
  } catch (err) {
    logger.error(`Error getting order ${req.params.id}:`, err.message, err.stack);
    res.status(500).json({ 
      error: err.message, 
      details: err.toString(),
      sql: err.sql 
    });
  }
};

// เพิ่มออร์เดอร์ใหม่ (รองรับ order_items และ payment_proof)
export const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const {
      user_id,
      customer_name,
      customer_phone,
      delivery_address,
      payment_method,
      payment_status,
      total_amount,
      status,
      order_items,
      payment_proof
    } = req.body;

    // ตรวจสอบว่า payment_method ถูกต้องหรือไม่
    if (!['qr', 'cod'].includes(payment_method)) {
      return res.status(400).json({ error: "Invalid payment method. Allowed: 'qr' or 'cod'" });
    }

    // เริ่ม transaction
    await connection.beginTransaction();

    // หา order_id ล่าสุดเพื่อสร้าง ID ใหม่แบบเรียงลำดับ O001, O002, O003...
    const [results] = await connection.query('SELECT order_id FROM Orders ORDER BY order_id DESC LIMIT 1');

    let nextNumber = 1;
    if (results.length > 0) {
      const lastId = results[0].order_id;
      if (lastId && lastId.startsWith('O')) {
        const lastNumber = parseInt(lastId.substring(1));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    const orderId = 'O' + nextNumber.toString().padStart(3, '0');

    // บันทึกข้อมูลออร์เดอร์
    const orderSql = `
      INSERT INTO Orders (
        order_id, user_id, customer_name, phone, order_date, 
        payment_method, payment_status, payment_proof, 
        paid_at, status, delivery_address, total_amount
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
    `;

    const orderValues = [
      orderId,
      user_id || 'U003',
      customer_name,
      customer_phone || null,
      payment_method,
      payment_status,
      payment_proof || null,
      payment_status === 'paid' ? new Date() : null,
      status || 'pending',
      delivery_address,
      total_amount
    ];

    await connection.query(orderSql, orderValues);

    // บันทึกรายการสินค้าในออร์เดอร์
    if (order_items && order_items.length > 0) {
      // ดึง orderitem_id สุดท้ายเพื่อสร้าง ID ใหม่แบบเรียงลำดับ
      const [lastItemResult] = await connection.query(
        'SELECT orderitem_id FROM OrderItems WHERE orderitem_id LIKE "OT%" ORDER BY CAST(SUBSTRING(orderitem_id, 3) AS UNSIGNED) DESC LIMIT 1'
      );
      
      let nextItemNumber = 1;
      if (lastItemResult.length > 0) {
        const lastItemId = lastItemResult[0].orderitem_id;
        if (lastItemId && lastItemId.startsWith('OT')) {
          const lastNumber = parseInt(lastItemId.substring(2));
          if (!isNaN(lastNumber)) {
            nextItemNumber = lastNumber + 1;
          }
        }
      }

      const itemSql = `
        INSERT INTO OrderItems (orderitem_id, order_id, product_id, quantity, price)
        VALUES ?
      `;

      // สร้าง orderitem_id แบบเรียงลำดับสำหรับแต่ละสินค้า (OT001, OT002, OT003...)
      const itemValues = order_items.map((item, index) => {
        const orderItemId = 'OT' + String(nextItemNumber + index).padStart(3, '0');
        return [orderItemId, orderId, item.product_id, item.quantity, item.price];
      });

      await connection.query(itemSql, [itemValues]);

      // ลดจำนวนสินค้าในสต็อก (ใช้ connection เดียวกัน)
      for (const item of order_items) {
        await connection.query(
          'UPDATE Products SET quantity = quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Commit transaction
      await connection.commit();

      res.json({
        success: true,
        message: 'Order created successfully',
        orderId: orderId,
        total_amount: total_amount
      });
    } else {
      await connection.rollback();
      res.status(400).json({ error: 'No order items provided' });
    }
  } catch (error) {
    logger.error('Error creating order:', error);
    await connection.rollback();
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  } finally {
    connection.release();
  }
};

// อัปเดตออร์เดอร์
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, customer_name, phone, order_date, payment_method, payment_status, delivery_address, total_amount } = req.body;

    if (payment_method && !['qr', 'cod'].includes(payment_method)) {
      return res.status(400).json({ error: "Invalid payment method. Allowed: 'qr' or 'cod'" });
    }

    await db.query(
      `UPDATE Orders 
       SET user_id = ?, customer_name = ?, phone = ?, order_date = ?, payment_method = ?, payment_status = ?, delivery_address = ?, total_amount = ?
       WHERE order_id = ?`,
      [user_id, customer_name, phone, order_date, payment_method, payment_status, delivery_address, total_amount, id]
    );
    
    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update order' });
  }
};

// ลบออร์เดอร์
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Deleting order:', id);
    
    // ลบ OrderItems ก่อน (เพราะมี Foreign Key constraint)
    const [deleteItemsResult] = await db.query('DELETE FROM OrderItems WHERE order_id = ?', [id]);
    logger.debug('Deleted OrderItems:', deleteItemsResult.affectedRows, 'items');
    
    // จากนั้นลบ Order
    const [deleteOrderResult] = await db.query('DELETE FROM Orders WHERE order_id = ?', [id]);
    logger.debug('Deleted Order:', deleteOrderResult.affectedRows, 'order');
    
    if (deleteOrderResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ 
      message: 'Order deleted successfully',
      deletedItems: deleteItemsResult.affectedRows,
      deletedOrder: deleteOrderResult.affectedRows
    });
  } catch (err) {
    logger.error('Error deleting order:', err);
    res.status(500).json({ error: err.message || 'Failed to delete order' });
  }
};

// อัปเดตสถานะการชำระเงิน
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    logger.info('Update payment status request:', { id, payment_status });

    // ตรวจสอบว่า payment_status ถูกต้องหรือไม่
    if (!['paid', 'unpaid'].includes(payment_status)) {
      return res.status(400).json({ error: "Invalid payment status. Allowed: 'paid' or 'unpaid'" });
    }

    const [result] = await db.query(
      'UPDATE Orders SET payment_status = ? WHERE order_id = ?',
      [payment_status, id]
    );
    
    logger.debug('Update result:', result);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: 'Payment status updated successfully' });
  } catch (err) {
    logger.error('Database error:', err);
    res.status(500).json({ error: err.message || 'Failed to update payment status' });
  }
};

// อัปเดตสถานะออเดอร์
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info('Update order status request:', { id, status });

    // ตรวจสอบว่า status ถูกต้องหรือไม่
    if (!['pending', 'preparing', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Allowed: 'pending', 'preparing', 'delivered', 'cancelled'" });
    }

    const [result] = await db.query(
      'UPDATE Orders SET status = ? WHERE order_id = ?',
      [status, id]
    );
    
    logger.debug('Update status result:', result);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Order not found" });
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    logger.error('Database error:', err);
    res.status(500).json({ error: err.message || 'Failed to update order status' });
  }
};

// ติดตามการจัดส่งโดยใช้ order_id และเบอร์โทรศัพท์
export const trackOrderByPhoneAndOrderId = async (req, res) => {
  try {
    const { orderId, phone } = req.query;

    logger.debug('Track Order request received:', { orderId, phone });

    if (!orderId || !phone) {
    logger.warn('Missing required parameters for track order');
      return res.status(400).json({ error: "Order ID and phone number are required" });
    }

    // Query เพื่อตรวจสอบ order_id และ phone (ตรวจสอบทั้ง Orders.phone และ Users.phone)
    const sql = `
      SELECT o.*, 
             u.username, 
             u.phone as user_phone, 
             u.email,
             u.address as user_address,
             COALESCE(o.phone, u.phone) as final_phone,
             COALESCE(o.delivery_address, u.address) as final_delivery_address
      FROM Orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ? AND (o.phone = ? OR u.phone = ?)
    `;

    logger.debug('Executing query for track order:', sql, [orderId, phone, phone]);

    const [results] = await db.query(sql, [orderId, phone, phone]);
    
    logger.debug('Query results:', results);
    
    if (results.length === 0) {
  logger.info('No matching records found for track order');
      return res.status(404).json({ 
        message: "ไม่พบข้อมูลการสั่งซื้อ กรุณาตรวจสอบหมายเลขคำสั่งซื้อและเบอร์โทรศัพท์อีกครั้ง" 
      });
    }

    const order = results[0];
    logger.debug('Found order:', order);
    
    // Format response data
    const trackingData = {
      order_id: order.order_id,
      customer_name: order.customer_name,
      username: order.username,
      phone: order.final_phone,
      user_phone: order.user_phone,
      email: order.email,
      address: order.final_delivery_address,
      order_date: order.order_date,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.status || 'pending',
      total_amount: order.total_amount,
      paid_at: order.paid_at
    };

    logger.debug('Returning tracking data:', trackingData);
    res.json(trackingData);
  } catch (err) {
    logger.error('Database error:', err);
    res.status(500).json({ error: err.message || 'Failed to track order' });
  }
};

// ดึงออร์เดอร์ตาม user_id
export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

  logger.info('Get orders by user ID request', { userId });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const sql = `
      SELECT o.*, 
             u.username, 
             u.email,
             u.phone as user_phone, 
             u.address as user_address,
             COALESCE(o.phone, u.phone) as final_phone,
             COALESCE(o.delivery_address, u.address) as final_delivery_address
      FROM Orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `;

    const [results] = await db.query(sql, [userId]);
    
    res.json(results);
  } catch (err) {
    logger.error('Database error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
};

// ยกเลิกออร์เดอร์โดยผู้ใช้ (เฉพาะออร์เดอร์ที่เป็นของตัวเองและยังยกเลิกได้)
export const cancelOrderByUser = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { orderId } = req.params;
    const { userId } = req.body;

    logger.info('Cancel order request:', { orderId, userId });

    if (!orderId || !userId) {
      return res.status(400).json({ error: "Order ID and User ID are required" });
    }

    await connection.beginTransaction();

    // ตรวจสอบว่าออร์เดอร์เป็นของผู้ใช้และสามารถยกเลิกได้
    const checkSql = `
      SELECT order_id, user_id, status, payment_status 
      FROM Orders 
      WHERE order_id = ? AND user_id = ?
    `;

    const [results] = await connection.query(checkSql, [orderId, userId]);

    if (results.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Order not found or not owned by user" });
    }

    const order = results[0];
    
    // ตรวจสอบสถานะ - สามารถยกเลิกได้เฉพาะออร์เดอร์ที่ยังไม่จัดส่ง
    if (order.status === 'delivered') {
      await connection.rollback();
      return res.status(400).json({ error: "Cannot cancel delivered order" });
    }
    
    if (order.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ error: "Order is already cancelled" });
    }

    // ดึงรายการสินค้าในออร์เดอร์เพื่อคืนจำนวนสต็อก
    const getOrderItemsSql = `
      SELECT product_id, quantity 
      FROM OrderItems 
      WHERE order_id = ?
    `;

    const [orderItems] = await connection.query(getOrderItemsSql, [orderId]);

    // อัปเดตสถานะเป็น cancelled
    const updateSql = `
      UPDATE Orders 
      SET status = 'cancelled' 
      WHERE order_id = ? AND user_id = ?
    `;

    await connection.query(updateSql, [orderId, userId]);

    // คืนจำนวนสินค้าเข้าสต็อก (ใช้ connection เดียวกัน)
    for (const item of orderItems) {
      await connection.query(
        'UPDATE Products SET quantity = quantity + ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    logger.info('Order cancelled and stock restored successfully:', { orderId, userId });
    
    res.json({ 
      message: 'Order cancelled successfully',
      order_id: orderId
    });
  } catch (error) {
  logger.error('Error cancelling order:', error);
    await connection.rollback();
    res.status(500).json({ error: 'Failed to cancel order', details: error.message });
  } finally {
    connection.release();
  }
};

// คำนวณและอัปเดตราคารวมของออร์เดอร์
export const calculateAndUpdateOrderTotal = async (req, res) => {
  try {
    const { order_id } = req.params;

    // คำนวณราคารวมจาก OrderItems
    const calculateTotalSql = `
      SELECT SUM(oi.quantity * p.price) as total_amount
      FROM OrderItems oi
      JOIN Products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `;

    const [results] = await db.query(calculateTotalSql, [order_id]);
    const totalAmount = results[0]?.total_amount || 0;

    // อัปเดตยอดรวมในตาราง Orders
    const updateTotalSql = `
      UPDATE Orders 
      SET total_amount = ?
      WHERE order_id = ?
    `;

    await db.query(updateTotalSql, [totalAmount, order_id]);

    res.json({ 
      message: 'Order total updated successfully',
      order_id: order_id,
      total_amount: totalAmount
    });
  } catch (err) {
  logger.error('Error calculating/updating total:', err);
    res.status(500).json({ error: err.message || 'Failed to update order total' });
  }
};

// อัปเดตที่อยู่จัดส่งในออร์เดอร์
export const updateDeliveryAddress = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { delivery_address } = req.body;

    if (!delivery_address) {
      return res.status(400).json({ error: "Delivery address is required" });
    }

    const [result] = await db.query(
      `UPDATE Orders 
       SET delivery_address = ?
       WHERE order_id = ?`,
      [delivery_address, order_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ 
      message: 'Delivery address updated successfully',
      order_id: order_id,
      delivery_address: delivery_address
    });
  } catch (err) {
  logger.error('Error updating delivery address:', err);
    res.status(500).json({ error: err.message || 'Failed to update delivery address' });
  }
};

// อัปเดต delivery_address ของออร์เดอร์ที่เป็น NULL ให้ใช้ address จาก Users
export const syncDeliveryAddressFromUsers = async (req, res) => {
  try {
    const sql = `
      UPDATE Orders o 
      JOIN users u ON o.user_id = u.user_id 
      SET o.delivery_address = u.address 
      WHERE o.delivery_address IS NULL AND u.address IS NOT NULL AND u.address != '-'
    `;

    const [result] = await db.query(sql);

    res.json({ 
      message: 'Delivery addresses synced successfully',
      affected_rows: result.affectedRows
    });
  } catch (err) {
  logger.error('Error syncing delivery addresses:', err);
    res.status(500).json({ error: err.message || 'Failed to sync delivery addresses' });
  }
};



