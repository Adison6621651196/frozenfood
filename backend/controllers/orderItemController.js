import mysql from 'mysql2';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'frozen_food',
});

export const getAllOrderItems = (req, res) => {
  db.query('SELECT * FROM OrderItems', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

export const getOrderItemById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM OrderItems WHERE orderitem_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ message: "Item not found" });
    res.json(results[0]);
  });
};

export const getOrderItemsByOrderId = (req, res) => {
  const { orderId } = req.params;
  db.query('SELECT * FROM OrderItems WHERE order_id = ?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

export const createOrderItem = (req, res) => {
  const { orderitem_id, order_id, product_id, quantity, price } = req.body;
  db.query(
    'INSERT INTO OrderItems (orderitem_id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
    [orderitem_id, order_id, product_id, quantity, price],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: 'Order item created' });
    }
  );
};

export const updateOrderItem = (req, res) => {
  const { id } = req.params;
  const { order_id, product_id, quantity } = req.body;
  db.query(
    'UPDATE OrderItems SET order_id=?, product_id=?, quantity=? WHERE order_item_id=?',
    [order_id, product_id, quantity, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Order item updated' });
    }
  );
};

export const deleteOrderItem = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM OrderItems WHERE orderitem_id=?', [id], (err, result) => {
    if (err) {
      logger.error('Delete error:', err);
      return res.status(500).json({ error: err });
    }
  // delete result processed
    res.json({ message: 'Order item deleted' });
  });
};
